import type { RegistryDataset, RegistryEntry } from '../types';

export type RegistryDatasetInput<TEntry extends RegistryEntry> = Omit<
  RegistryDataset<TEntry>,
  'schema_version'
> & {
  schema_version: number;
};

export function defineDataset<TEntry extends RegistryEntry>(
  dataset: RegistryDatasetInput<TEntry>,
): RegistryDataset<TEntry> {
  if (dataset.schema_version !== 2) {
    throw new Error(`Unexpected schema_version ${dataset.schema_version}`);
  }

  return dataset as RegistryDataset<TEntry>;
}
