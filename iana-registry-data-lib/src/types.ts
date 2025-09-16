export interface RegistryEntry {
  entry_id: string;
}

export interface RegistryMetadata {
  datasource_url: string;
  required_specifications: string[];
  last_updated_iso: string;
}

export interface RegistryDataset<TEntry extends RegistryEntry = RegistryEntry> {
  schema_version: 2;
  registry_id: string;
  dataset_id: string;
  name: string;
  metadata: RegistryMetadata;
  entries: TEntry[];
}
