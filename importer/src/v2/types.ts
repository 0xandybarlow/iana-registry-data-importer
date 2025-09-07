export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

export interface RegistryEntryV2 extends JSONObject {
  entry_id: string; // stable slug/id from primary key(s)
  // additional normalized fields per dataset; dynamic keys are allowed
}

export interface RegistryMetadataV2 {
  datasource_url: string;
  required_specifications: string[];
  last_updated_iso: string; // ISO 8601
}

export interface RegistryDatasetV2 {
  schema_version: 2;
  registry_id: string; // e.g., oauth_registry
  dataset_id: string; // e.g., oauth_parameters
  name: string; // human-friendly dataset name
  metadata: RegistryMetadataV2;
  entries: RegistryEntryV2[];
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
  added: RegistryEntryV2[];
  removed: RegistryEntryV2[];
  modified: EntryChange[];
  formatUpgraded?: boolean; // true when v1 file was rewritten to v2 format
}
