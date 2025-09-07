import { promises as fs } from 'fs';
import path from 'path';
import { csvToObject } from '../convertCsvToObject';
import { getData } from '../util/network';
import { buildDatasetV2, normalizeCsvRecord } from './normalize';
import { REGISTRIES_V2 } from './sources';
import { DatasetChangeSummary, RegistryDatasetV2 } from './types';
import { diffDatasets } from './compare';
import { renderChangelogBody } from './changelog';

const LIB_DATA_ROOT = path.resolve(
  __dirname,
  '../../../iana-registry-data-lib/src/registries',
);

const detectPrimaryKeys = (record: Record<string, string>): string[] => {
  const preferred = ['name', 'value', 'parameter', 'claim', 'alg', 'type', 'token_type', 'uri'];
  const keys = Object.keys(record).map((k) => k.toLowerCase().replace(/\s+/g, '_'));
  const hit = preferred.find((p) => keys.includes(p));
  return hit ? [hit] : [keys[0]];
};

const readExistingDataset = async (
  registry_id: string,
  dataset_id: string,
): Promise<RegistryDatasetV2 | undefined> => {
  const dataDir = path.join(LIB_DATA_ROOT, registry_id);
  const file = path.join(dataDir, `${dataset_id}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as RegistryDatasetV2;
  } catch {
    return undefined;
  }
};

const writeDataset = async (dataset: RegistryDatasetV2) => {
  const dataDir = path.join(LIB_DATA_ROOT, dataset.registry_id);
  await fs.mkdir(dataDir, { recursive: true });
  const outFile = path.join(dataDir, `${dataset.dataset_id}.json`);
  await fs.writeFile(outFile, JSON.stringify(dataset, null, 2));
};

export const checkAndUpdate = async (): Promise<{ changed: boolean; summaries: DatasetChangeSummary[] }> => {
  const summaries: DatasetChangeSummary[] = [];

  for (const reg of REGISTRIES_V2) {
    for (const ds of reg.sources) {
      try {
        const csv = await getData(ds.url);
        const rows = await csvToObject(csv);
        const entries = rows.map((r) =>
          normalizeCsvRecord(r, ds.primary_keys ?? detectPrimaryKeys(r)),
        );
        const dataset = buildDatasetV2({
          registry_id: ds.registry_id,
          dataset_id: ds.dataset_id,
          name: ds.name,
          datasource_url: ds.url,
          required_specifications: ds.required_specifications,
          entries,
        });

        const existing = await readExistingDataset(dataset.registry_id, dataset.dataset_id);
        const diff = diffDatasets(existing, dataset);
        summaries.push(diff);
        if (diff.hasChanges) {
          await writeDataset(dataset);
        }
      } catch (err) {
        console.error(`Failed processing ${ds.url}: ${(err as Error).message}`);
      }
    }
  }

  const changed = summaries.some((s) => s.hasChanges);
  const body = renderChangelogBody(summaries);
  const prBodyPath = path.resolve(process.cwd(), 'CHANGELOG_UPDATE.md');
  await fs.writeFile(prBodyPath, body, 'utf8');
  console.log(body);
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
