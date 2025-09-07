export interface V2RegistryEntry {
  entry_id: string;
  [key: string]: unknown;
}

export interface V2RegistryMetadata {
  datasource_url: string;
  required_specifications: string[];
  last_updated_iso: string;
}

export interface V2RegistryDataset {
  schema_version: 2;
  registry_id: string;
  dataset_id: string;
  name: string;
  metadata: V2RegistryMetadata;
  entries: V2RegistryEntry[];
}

