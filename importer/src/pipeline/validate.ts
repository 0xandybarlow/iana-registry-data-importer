import { DatasourceConfig } from './sources';
import { RegistryDataset } from './types';

export interface DatasetIdentity {
  registry_id: string;
  dataset_id: string;
}

interface ValidationOptions {
  allowedDuplicateEntryIds?: ReadonlySet<string>;
}

const identityLabel = (identity: DatasetIdentity): string =>
  `${identity.registry_id}/${identity.dataset_id}`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateMetadata = (value: unknown): boolean => {
  if (!isObject(value)) return false;
  return (
    typeof value.datasource_url === 'string' &&
    Array.isArray(value.required_specifications) &&
    value.required_specifications.every((item) => typeof item === 'string') &&
    typeof value.last_updated_iso === 'string'
  );
};

export const validateDatasetWithOptions = (
  value: unknown,
  expected: DatasetIdentity,
  options: ValidationOptions = {},
): RegistryDataset => {
  const label = identityLabel(expected);
  if (!isObject(value)) {
    throw new Error(`${label}: expected object`);
  }
  if (value.schema_version !== 2) {
    throw new Error(`${label}: unsupported schema_version`);
  }
  if (
    value.registry_id !== expected.registry_id ||
    value.dataset_id !== expected.dataset_id
  ) {
    throw new Error(`${label}: identity mismatch`);
  }
  if (typeof value.name !== 'string') {
    throw new Error(`${label}: invalid name`);
  }
  if (!validateMetadata(value.metadata)) {
    throw new Error(`${label}: invalid metadata`);
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    throw new Error(`${label}: entries must be non-empty`);
  }

  const ids = new Set<string>();
  for (const entry of value.entries) {
    if (!isObject(entry)) {
      throw new Error(`${label}: invalid entry`);
    }
    if (typeof entry.entry_id !== 'string' || entry.entry_id.trim() === '') {
      throw new Error(`${label}: blank entry_id`);
    }
    if (
      ids.has(entry.entry_id) &&
      !options.allowedDuplicateEntryIds?.has(entry.entry_id)
    ) {
      throw new Error(`${label}: duplicate entry_id "${entry.entry_id}"`);
    }
    ids.add(entry.entry_id);
  }

  return value as unknown as RegistryDataset;
};

export const validateDataset = (
  value: unknown,
  expected: DatasetIdentity,
): RegistryDataset => validateDatasetWithOptions(value, expected);

export const validateDatasetSet = (
  datasets: RegistryDataset[],
  expected: DatasourceConfig[],
): void => {
  const expectedKeys = new Set(expected.map((config) => identityLabel(config)));
  const actualKeys = new Set(datasets.map((dataset) => identityLabel(dataset)));

  for (const key of expectedKeys) {
    if (!actualKeys.has(key)) {
      throw new Error(`${key}: missing configured dataset`);
    }
  }
  for (const key of actualKeys) {
    if (!expectedKeys.has(key)) {
      throw new Error(`${key}: unconfigured dataset`);
    }
  }
  if (datasets.length !== actualKeys.size) {
    const seen = new Set<string>();
    for (const dataset of datasets) {
      const key = identityLabel(dataset);
      if (seen.has(key)) {
        throw new Error(`${key}: duplicate dataset`);
      }
      seen.add(key);
    }
  }
};
