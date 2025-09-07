import { promises as fs } from 'fs';
import path from 'path';
import { csvToObject } from '../convertCsvToObject';
import { getData } from '../util/network';
import { buildDataset, normalizeCsvRecord } from './normalize';
import { REGISTRIES } from './sources';
import { DatasetChangeSummary, RegistryDataset } from './types';
import { diffDatasets } from './compare';
import { renderChangelogBody } from './changelog';
import { debug, error, info } from './logger';

const LIB_DATA_ROOT = path.resolve(
  __dirname,
  '../../../iana-registry-data-lib/src/registries',
);

const detectPrimaryKeys = (record: Record<string, string>): string[] => {
  const preferred = [
    'name',
    'value',
    'parameter',
    'claim',
    'alg',
    'type',
    'token_type',
    'uri',
  ];
  const keys = Object.keys(record).map((k) =>
    k.toLowerCase().replace(/\s+/g, '_'),
  );
  const hit = preferred.find((p) => keys.includes(p));
  return hit ? [hit] : [keys[0]];
};

const readExistingDataset = async (
  registry_id: string,
  dataset_id: string,
): Promise<RegistryDataset | undefined> => {
  const dataDir = path.join(LIB_DATA_ROOT, registry_id);
  const file = path.join(dataDir, `${dataset_id}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as RegistryDataset;
  } catch {
    return undefined;
  }
};

const writeDataset = async (dataset: RegistryDataset) => {
  const dataDir = path.join(LIB_DATA_ROOT, dataset.registry_id);
  await fs.mkdir(dataDir, { recursive: true });
  const outFile = path.join(dataDir, `${dataset.dataset_id}.json`);
  await fs.writeFile(outFile, JSON.stringify(dataset, null, 2));
};

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
  if (!existing) return existing as unknown as RegistryDataset;
  const maybeEntries = existing as ExistingEntriesLike;
  if (maybeEntries && Array.isArray(maybeEntries.entries))
    return existing as RegistryDataset;
  const maybeV1 = existing as ExistingV1Like;
  const v1Params = maybeV1.parameters;
  if (Array.isArray(v1Params)) {
    const entries = v1Params.map((r: Record<string, string>) =>
      normalizeCsvRecord(r, primaryKeys),
    );
    return {
      schema_version: 2,
      registry_id: fallback.registry_id,
      dataset_id: fallback.dataset_id,
      name: fallback.name,
      metadata: {
        datasource_url: fallback.metadata.datasource_url,
        required_specifications: fallback.metadata.required_specifications,
        last_updated_iso:
          (maybeV1.metadata &&
            (maybeV1.metadata.last_updated ||
              maybeV1.metadata.last_processed)) ||
          fallback.metadata.last_updated_iso,
      },
      entries,
    };
  }
  return fallback;
};

const getFilter = () => {
  const argv = process.argv.slice(2);
  const fFlag = argv.find((a) => a.startsWith('--filter='));
  const fromFlag = fFlag ? fFlag.split('=')[1] : undefined;
  const fromEnv = process.env.DATASET_FILTER;
  return (fromFlag || fromEnv || '').toLowerCase();
};

export const checkAndUpdate = async (): Promise<{
  changed: boolean;
  summaries: DatasetChangeSummary[];
}> => {
  const summaries: DatasetChangeSummary[] = [];
  const filter = getFilter();

  for (const reg of REGISTRIES) {
    for (const ds of reg.sources) {
      const key = `${ds.registry_id}/${ds.dataset_id}`.toLowerCase();
      if (
        filter &&
        !key.includes(filter) &&
        !ds.dataset_id.toLowerCase().includes(filter)
      )
        continue;
      try {
        const csv = await getData(ds.url);
        const rows = await csvToObject(csv);
        const sampleRow =
          Array.isArray(rows) && rows.length ? rows[0] : undefined;
        const detectedKeys = sampleRow
          ? detectPrimaryKeys(sampleRow)
          : ['name'];
        const primaryKeys = ds.primary_keys ?? detectedKeys;
        debug(
          `[importer] Keys for ${ds.registry_id}/${ds.dataset_id}: ${primaryKeys.join(', ')}`,
        );
        if (Array.isArray(rows) && sampleRow)
          debug(
            `[importer] Sample keys ${ds.dataset_id}: ${Object.keys(sampleRow).join(', ')}`,
          );
        const entries = Array.isArray(rows)
          ? rows.map((r) => normalizeCsvRecord(r, primaryKeys))
          : [];
        const dataset = buildDataset({
          registry_id: ds.registry_id,
          dataset_id: ds.dataset_id,
          name: ds.name,
          datasource_url: ds.url,
          required_specifications: ds.required_specifications,
          entries,
        });

        const existingRaw = await readExistingDataset(
          dataset.registry_id,
          dataset.dataset_id,
        );
        const isNewShape =
          !!existingRaw &&
          Array.isArray((existingRaw as ExistingEntriesLike).entries);
        const existing = existingRaw
          ? coerceExisting(existingRaw, dataset, primaryKeys)
          : undefined;
        const diff = diffDatasets(existing, dataset);
        if (!diff.hasChanges && existingRaw && !isNewShape) {
          diff.formatUpgraded = true;
          diff.hasChanges = true;
        }
        summaries.push(diff);
        if (diff.hasChanges) await writeDataset(dataset);
      } catch (err) {
        error(`Failed processing ${ds.url}: ${(err as Error).message}`);
        if (process.env.DEBUG_IMPORTER && err instanceof Error && err.stack)
          error(err.stack);
      }
    }
  }

  const changed = summaries.some((s) => s.hasChanges);
  const body = renderChangelogBody(summaries);
  const prBodyPath = path.resolve(process.cwd(), 'CHANGELOG_UPDATE.md');
  await fs.writeFile(prBodyPath, body, 'utf8');
  info(body);
  return { changed, summaries };
};

if (require.main === module) {
  checkAndUpdate()
    .then(({ changed }) => {
      console.log(changed ? 'Changes detected.' : 'No changes detected.');
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
