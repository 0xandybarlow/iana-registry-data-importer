import { diffDatasets } from '../pipeline/compare';
import { RegistryDataset, RegistryEntry } from '../pipeline/types';

const makeDataset = (entries: RegistryEntry[]): RegistryDataset => ({
  schema_version: 2,
  registry_id: 'test_registry',
  dataset_id: 'test_dataset',
  name: 'Test Dataset',
  metadata: {
    datasource_url: 'url',
    required_specifications: [],
    last_updated_iso: '2020-01-01T00:00:00.000Z',
  },
  entries,
});

describe('diffDatasets', () => {
  it('detects added and removed entries by entry_id', () => {
    const oldD = makeDataset([{ entry_id: 'a', name: 'A' }]);
    const newD = makeDataset([{ entry_id: 'b', name: 'B' }]);
    const diff = diffDatasets(oldD, newD);
    expect(diff.added.length).toBe(1);
    expect(diff.removed.length).toBe(1);
  });

  it('ignores order-only differences', () => {
    const oldD = makeDataset([
      { entry_id: 'a', name: 'A' },
      { entry_id: 'b', name: 'B' },
    ]);
    const newD = makeDataset([
      { entry_id: 'b', name: 'B' },
      { entry_id: 'a', name: 'A' },
    ]);
    const diff = diffDatasets(oldD, newD);
    expect(diff.hasChanges).toBe(false);
  });
});
