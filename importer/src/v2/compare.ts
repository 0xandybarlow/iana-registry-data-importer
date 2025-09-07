import {
  DatasetChangeSummary,
  FieldChange,
  RegistryDataset,
  RegistryEntry,
  JSONValue,
} from './types';

const jsonEqual = (a: JSONValue, b: JSONValue): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // Order-insensitive compare for arrays of scalars
    const sa = [...a].map(String).sort();
    const sb = [...b].map(String).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  return JSON.stringify(a) === JSON.stringify(b);
};

const entryFieldDiff = (
  oldE: RegistryEntry,
  newE: RegistryEntry,
): FieldChange[] => {
  const fields = new Set([...Object.keys(oldE), ...Object.keys(newE)]);
  fields.delete('entry_id');
  const changes: FieldChange[] = [];
  for (const f of fields) {
    const ov = oldE[f] as JSONValue | undefined;
    const nv = newE[f] as JSONValue | undefined;
    if (!jsonEqual(ov as JSONValue, nv as JSONValue)) {
      changes.push({ field: f, oldValue: ov, newValue: nv });
    }
  }
  return changes;
};

export const diffDatasets = (
  oldD: RegistryDataset | undefined,
  newD: RegistryDataset,
): DatasetChangeSummary => {
  const summary: DatasetChangeSummary = {
    registry_id: newD.registry_id,
    dataset_id: newD.dataset_id,
    name: newD.name,
    hasChanges: false,
    added: [],
    removed: [],
    modified: [],
  };

  if (!oldD) {
    summary.hasChanges = true;
    summary.added = newD.entries;
    return summary;
  }

  // Map by entry_id
  const oldMap = new Map<string, RegistryEntry>(
    oldD.entries.map((e) => [e.entry_id, e]),
  );
  const newMap = new Map<string, RegistryEntry>(
    newD.entries.map((e) => [e.entry_id, e]),
  );

  // Detect removed
  for (const [id, e] of oldMap) {
    if (!newMap.has(id)) {
      summary.removed.push(e);
    }
  }
  // Detect added and modified
  for (const [id, newE] of newMap) {
    const oldE = oldMap.get(id);
    if (!oldE) {
      summary.added.push(newE);
      continue;
    }
    const fieldChanges = entryFieldDiff(oldE, newE);
    if (fieldChanges.length > 0) {
      summary.modified.push({
        entry_id: id,
        type: 'field_changed',
        changes: fieldChanges,
      });
    }
  }

  summary.hasChanges =
    summary.added.length > 0 ||
    summary.removed.length > 0 ||
    summary.modified.length > 0;
  return summary;
};
