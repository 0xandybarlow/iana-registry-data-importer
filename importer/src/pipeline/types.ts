export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];

export interface RegistryEntry extends JSONObject {
  entry_id: string;
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

export type ChangeType =
  | 'entry_added'
  | 'entry_removed'
  | 'field_changed'
  | 'reference_added'
  | 'reference_removed'
  | 'status_changed'
  | 'description_changed';

export interface FieldChange {
  field: string;
  oldValue: JSONValue | undefined;
  newValue: JSONValue | undefined;
}

export interface EntryChange {
  entry_id: string;
  type: ChangeType;
  changes?: FieldChange[];
}

export interface DatasetChangeSummary {
  registry_id: string;
  dataset_id: string;
  name: string;
  hasChanges: boolean;
  added: RegistryEntry[];
  removed: RegistryEntry[];
  modified: EntryChange[];
  formatUpgraded?: boolean;
}
