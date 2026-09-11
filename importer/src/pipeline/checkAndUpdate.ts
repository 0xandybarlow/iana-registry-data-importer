import { promises as fs } from 'fs';
import path from 'path';
import { diffDatasets } from './compare';
import { renderChangelogBody } from './changelog';
import { info } from './logger';
import { normalizeCsvRecord } from './normalize';
import { DatasourceConfig, REGISTRIES } from './sources';
import { collectSweep } from './sweep';
import {
  DatasetChangeSummary,
  RegistryDataset,
  UpdateSummaryDocument,
} from './types';
import { validateDatasetSet } from './validate';

const LIB_DATA_ROOT = path.resolve(
  __dirname,
  '../../../iana-registry-data-lib/src/registries',
);

type ReadText = (file: string) => Promise<string | undefined>;
type WriteText = (file: string, contents: string) => Promise<void>;

export interface CheckAndUpdateOptions {
  filter?: string;
  summaryPath?: string;
  prBodyPath?: string;
  fetchText?: (url: string) => Promise<string>;
  dataRoot?: string;
  now?: () => Date;
  configs?: DatasourceConfig[];
  readText?: ReadText;
  writeText?: WriteText;
}

type ExistingEntriesLike = { entries?: unknown };
type ExistingV1Like = {
  parameters?: Record<string, string>[];
  metadata?: { last_updated?: string; last_processed?: string };
};

const coerceExisting = (
  existing: unknown,
  fallback: RegistryDataset,
  primaryKeys: string[],
): RegistryDataset => {
  const maybeEntries = existing as ExistingEntriesLike;
  if (Array.isArray(maybeEntries.entries)) return existing as RegistryDataset;
  const maybeV1 = existing as ExistingV1Like;
  if (Array.isArray(maybeV1.parameters)) {
    return {
      schema_version: 2,
      registry_id: fallback.registry_id,
      dataset_id: fallback.dataset_id,
      name: fallback.name,
      metadata: {
        datasource_url: fallback.metadata.datasource_url,
        required_specifications: fallback.metadata.required_specifications,
        last_updated_iso:
          maybeV1.metadata?.last_updated ??
          maybeV1.metadata?.last_processed ??
          fallback.metadata.last_updated_iso,
      },
      entries: maybeV1.parameters.map((record) =>
        normalizeCsvRecord(record, primaryKeys),
      ),
    };
  }
  throw new Error(
    `${fallback.registry_id}/${fallback.dataset_id}: unsupported committed dataset shape`,
  );
};

const defaultReadText: ReadText = async (file) => {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
};

const defaultWriteText: WriteText = (file, contents) =>
  fs.writeFile(file, contents, 'utf8');

const cliOption = (name: string): string | undefined => {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value?.slice(prefix.length);
};

const configuredFilter = (): string =>
  cliOption('--filter') ?? process.env.DATASET_FILTER ?? '';

const datasetFile = (dataRoot: string, dataset: RegistryDataset): string =>
  path.join(dataRoot, dataset.registry_id, `${dataset.dataset_id}.json`);

export const checkAndUpdate = async (
  options: CheckAndUpdateOptions = {},
): Promise<UpdateSummaryDocument> => {
  const configs =
    options.configs ?? REGISTRIES.flatMap((registry) => registry.sources);
  const filter = (options.filter ?? configuredFilter()).toLowerCase();
  const selectedConfigs = filter
    ? configs.filter((config) => {
        const key = `${config.registry_id}/${config.dataset_id}`.toLowerCase();
        return (
          key.includes(filter) ||
          config.dataset_id.toLowerCase().includes(filter)
        );
      })
    : configs;
  const complete = filter.length === 0;
  const diagnostic = !complete;
  const dataRoot = options.dataRoot ?? LIB_DATA_ROOT;
  const readText = options.readText ?? defaultReadText;
  const writeText = options.writeText ?? defaultWriteText;
  const datasets = await collectSweep(selectedConfigs, options.fetchText);

  if (complete) validateDatasetSet(datasets, configs);

  const comparisons: {
    dataset: RegistryDataset;
    summary: DatasetChangeSummary;
  }[] = [];
  for (let index = 0; index < datasets.length; index += 1) {
    const dataset = datasets[index];
    const config = selectedConfigs[index];
    const raw = await readText(datasetFile(dataRoot, dataset));
    const parsed = raw === undefined ? undefined : (JSON.parse(raw) as unknown);
    const existing =
      parsed === undefined
        ? undefined
        : coerceExisting(parsed, dataset, config.primary_keys ?? ['name']);
    const summary = diffDatasets(existing, dataset);
    if (
      parsed !== undefined &&
      !Array.isArray((parsed as ExistingEntriesLike).entries) &&
      !summary.hasChanges
    ) {
      summary.formatUpgraded = true;
      summary.hasChanges = true;
    }
    comparisons.push({ dataset, summary });
  }

  const document: UpdateSummaryDocument = {
    schema_version: 1,
    complete,
    diagnostic,
    changed: comparisons.some(({ summary }) => summary.hasChanges),
    generated_at: (options.now ?? (() => new Date()))().toISOString(),
    datasets: comparisons.map(({ summary }) => summary),
  };
  const body = renderChangelogBody(document);

  if (!diagnostic) {
    for (const { dataset, summary } of comparisons) {
      if (!summary.hasChanges) continue;
      const file = datasetFile(dataRoot, dataset);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await writeText(file, JSON.stringify(dataset, null, 2));
    }
  }
  if (options.summaryPath) {
    await fs.mkdir(path.dirname(options.summaryPath), { recursive: true });
    await writeText(
      options.summaryPath,
      `${JSON.stringify(document, null, 2)}\n`,
    );
  }
  if (options.prBodyPath) {
    await fs.mkdir(path.dirname(options.prBodyPath), { recursive: true });
    await writeText(options.prBodyPath, `${body}\n`);
  }

  info(body);
  return document;
};

if (require.main === module) {
  checkAndUpdate({
    summaryPath: cliOption('--summary'),
    prBodyPath: cliOption('--pr-body'),
  })
    .then(({ changed }) => {
      console.log(changed ? 'Changes detected.' : 'No changes detected.');
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
