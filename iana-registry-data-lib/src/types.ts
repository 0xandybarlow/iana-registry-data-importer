export interface RegistryEntry {
  entry_id: string;
  [key: string]: unknown;
}

export interface RegistryMetadata {
  datasource_url: string;
  required_specifications: string[];
  last_updated_iso: string;
}

export interface RegistryDataset {
  schema_version: 2;
  registry_id: string;
  dataset_id: string;
  name: string;
  metadata: RegistryMetadata;
  entries: RegistryEntry[];
}
