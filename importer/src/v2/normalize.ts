import { JSONObject, JSONValue, RegistryDatasetV2, RegistryEntryV2 } from './types';

const toSnakeCase = (str: string): string =>
  str
    .toLowerCase()
    .replace(/\(s\)/g, '')
    .replace(/"/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

export const cleanText = (str: string): string =>
  str
    .replace(/[\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/, Section/g, ' - Section')
    .trim();

// no hash fallback is used; keep IDs raw/cleaned for consistency

export const stableSlug = (input: string): string => cleanText(String(input));

const deepMapKeysSnakeCase = (obj: JSONObject): JSONObject => {
  const out: JSONObject = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    const nk = toSnakeCase(k);
    out[nk] = Array.isArray(v)
      ? (v as JSONValue[]).map((item) => (typeof item === 'string' ? cleanText(item) : item))
      : typeof v === 'string'
      ? cleanText(v)
      : (v as JSONValue);
  });
  return out;
};

export const normalizeCsvRecord = (
  record: Record<string, string>,
  primaryKeyFields: string[],
): RegistryEntryV2 => {
  const normalized = deepMapKeysSnakeCase(record as unknown as JSONObject);
  const pkParts = primaryKeyFields
    .map((k) => normalized[toSnakeCase(k)])
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter((v) => v.length > 0);
  const entry_id = pkParts.length > 0 ? pkParts.join(' | ') : cleanText(JSON.stringify(normalized));
  return { entry_id, ...normalized } as RegistryEntryV2;
};

export const sortEntriesDeterministically = (
  entries: RegistryEntryV2[],
  sortKey: string,
): RegistryEntryV2[] => {
  const key = toSnakeCase(sortKey);
  return [...entries].sort((a, b) => {
    const av = String(a[key] ?? a.entry_id);
    const bv = String(b[key] ?? b.entry_id);
    return av.localeCompare(bv);
  });
};

export const deepSortObject = (obj: JSONObject): JSONObject => {
  const sorted: JSONObject = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      const v = obj[k];
      if (Array.isArray(v)) {
        sorted[k] = v.map((i) => (typeof i === 'object' && i !== null ? i : i)) as JSONValue;
      } else if (typeof v === 'object' && v !== null) {
        sorted[k] = deepSortObject(v as JSONObject);
      } else {
        sorted[k] = v as JSONValue;
      }
    });
  return sorted;
};

export const buildDatasetV2 = (args: {
  registry_id: string;
  dataset_id: string;
  name: string;
  datasource_url: string;
  required_specifications: string[];
  entries: RegistryEntryV2[];
}): RegistryDatasetV2 => {
  const entries = sortEntriesDeterministically(args.entries, 'name');
  return {
    schema_version: 2,
    registry_id: args.registry_id,
    dataset_id: args.dataset_id,
    name: args.name,
    metadata: {
      datasource_url: args.datasource_url,
      required_specifications: args.required_specifications,
      last_updated_iso: new Date().toISOString(),
    },
    entries,
  };
};
