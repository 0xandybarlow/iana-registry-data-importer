import { csvToObject } from '../convertCsvToObject';
import { getData } from '../util/network';
import { buildDataset, normalizeCsvRecord } from './normalize';
import { DatasourceConfig } from './sources';
import { RegistryDataset } from './types';
import { validateDataset, validateDatasetSet } from './validate';

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
  const keys = Object.keys(record).map((key) =>
    key.toLowerCase().replace(/\s+/g, '_'),
  );
  const preferredKey = preferred.find((key) => keys.includes(key));
  return preferredKey ? [preferredKey] : [keys[0] ?? 'name'];
};

export const collectSweep = async (
  configs: DatasourceConfig[],
  fetchText: (url: string) => Promise<string> = getData,
): Promise<RegistryDataset[]> => {
  const datasets: RegistryDataset[] = [];

  for (const config of configs) {
    const label = `${config.registry_id}/${config.dataset_id}`;
    try {
      const rows = await csvToObject(await fetchText(config.url));
      const primaryKeys =
        config.primary_keys ?? detectPrimaryKeys(rows[0] ?? {});
      const entries = rows.map((row) => normalizeCsvRecord(row, primaryKeys));
      const dataset = buildDataset({
        registry_id: config.registry_id,
        dataset_id: config.dataset_id,
        name: config.name,
        datasource_url: config.url,
        required_specifications: config.required_specifications,
        entries,
      });
      datasets.push(validateDataset(dataset, config));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith(`${label}:`)) throw error;
      throw new Error(`${label}: ${message}`);
    }
  }

  validateDatasetSet(datasets, configs);
  return datasets;
};
