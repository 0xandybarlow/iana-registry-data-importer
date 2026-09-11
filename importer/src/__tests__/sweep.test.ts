import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { checkAndUpdate } from '../pipeline/checkAndUpdate';
import { DatasourceConfig, REGISTRIES } from '../pipeline/sources';
import { collectSweep } from '../pipeline/sweep';

const configs: DatasourceConfig[] = [
  {
    registry_id: 'test_registry',
    dataset_id: 'first',
    name: 'First',
    url: 'https://example.test/first.csv',
    required_specifications: [],
    primary_keys: ['name'],
  },
  {
    registry_id: 'test_registry',
    dataset_id: 'second',
    name: 'Second',
    url: 'https://example.test/second.csv',
    required_specifications: [],
    primary_keys: ['name'],
  },
];

const csv = (name: string): string =>
  `Name,Description\n${name},${name} entry\n`;

const existingDataset = (datasetId: string, name: string) => ({
  schema_version: 2,
  registry_id: 'test_registry',
  dataset_id: datasetId,
  name: datasetId === 'first' ? 'First' : 'Second',
  metadata: {
    datasource_url: `https://example.test/${datasetId}.csv`,
    required_specifications: [],
    last_updated_iso: '2026-09-10T00:00:00.000Z',
  },
  entries: [
    {
      entry_id: name,
      name,
      description: `${name} entry`,
    },
  ],
});

describe('atomic registry sweep', () => {
  let dataRoot: string;

  beforeEach(async () => {
    dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'iana-sweep-'));
  });

  afterEach(async () => {
    await fs.rm(dataRoot, { recursive: true, force: true });
  });

  const seedExisting = async (datasetId: string, name: string) => {
    const directory = path.join(dataRoot, 'test_registry');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, `${datasetId}.json`),
      JSON.stringify(existingDataset(datasetId, name)),
      'utf8',
    );
  };

  it('writes nothing when any later source fails validation', async () => {
    const writes: string[] = [];

    await expect(
      checkAndUpdate({
        configs,
        dataRoot,
        fetchText: async (url) =>
          url.endsWith('/first.csv') ? csv('one') : 'Name,Description\n',
        writeText: async (file, contents) => {
          writes.push(file);
          await fs.writeFile(file, contents, 'utf8');
        },
      }),
    ).rejects.toThrow('test_registry/second');

    expect(writes).toEqual([]);
    await expect(fs.readdir(dataRoot)).resolves.toEqual([]);
  });

  it('writes zero registry files for a complete no-change sweep', async () => {
    await seedExisting('first', 'one');
    await seedExisting('second', 'two');
    const writes: string[] = [];

    const result = await checkAndUpdate({
      configs,
      dataRoot,
      fetchText: async (url) =>
        url.endsWith('/first.csv') ? csv('one') : csv('two'),
      writeText: async (file, contents) => {
        writes.push(file);
        await fs.writeFile(file, contents, 'utf8');
      },
      now: () => new Date('2026-09-11T12:00:00.000Z'),
    });

    expect(writes).toEqual([]);
    expect(result).toMatchObject({
      schema_version: 1,
      complete: true,
      diagnostic: false,
      changed: false,
      generated_at: '2026-09-11T12:00:00.000Z',
    });
    expect(result.datasets).toHaveLength(2);
  });

  it('writes only changed datasets after the complete collection phase', async () => {
    await seedExisting('first', 'old');
    await seedExisting('second', 'two');
    const events: string[] = [];

    const result = await checkAndUpdate({
      configs,
      dataRoot,
      fetchText: async (url) => {
        const datasetId = url.endsWith('/first.csv') ? 'first' : 'second';
        events.push(`fetch:${datasetId}`);
        return datasetId === 'first' ? csv('new') : csv('two');
      },
      writeText: async (file, contents) => {
        events.push(`write:${path.basename(file)}`);
        await fs.writeFile(file, contents, 'utf8');
      },
      now: () => new Date('2026-09-11T12:00:00.000Z'),
    });

    expect(events).toEqual(['fetch:first', 'fetch:second', 'write:first.json']);
    expect(result.changed).toBe(true);
    expect(result.datasets.map((dataset) => dataset.hasChanges)).toEqual([
      true,
      false,
    ]);
    const written = JSON.parse(
      await fs.readFile(
        path.join(dataRoot, 'test_registry', 'first.json'),
        'utf8',
      ),
    ) as { entries: { entry_id: string }[] };
    expect(written.entries[0].entry_id).toBe('new');
  });

  it('keeps a filtered run diagnostic and writes only explicit diagnostic artifacts', async () => {
    await seedExisting('second', 'old');
    const writes: string[] = [];

    const result = await checkAndUpdate({
      configs,
      filter: 'second',
      dataRoot,
      summaryPath: path.join(dataRoot, 'summary.json'),
      prBodyPath: path.join(dataRoot, 'pr-body.md'),
      fetchText: async () => csv('new'),
      writeText: async (file, contents) => {
        writes.push(file);
        await fs.writeFile(file, contents, 'utf8');
      },
      now: () => new Date('2026-09-11T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      schema_version: 1,
      complete: false,
      diagnostic: true,
      changed: true,
      generated_at: '2026-09-11T12:00:00.000Z',
    });
    expect(result.datasets).toHaveLength(1);
    expect(writes).toEqual([
      path.join(dataRoot, 'summary.json'),
      path.join(dataRoot, 'pr-body.md'),
    ]);
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(dataRoot, 'test_registry', 'second.json'),
          'utf8',
        ),
      ).entries[0].entry_id,
    ).toBe('old');
  });
});

describe('configured collision keys', () => {
  const allConfigs = REGISTRIES.flatMap((registry) => registry.sources);
  const configured = (datasetId: string): DatasourceConfig => {
    const match = allConfigs.find((config) => config.dataset_id === datasetId);
    if (!match) throw new Error(`missing test config ${datasetId}`);
    return match;
  };

  it('makes JSON Web Key Parameter IDs unique by key type', async () => {
    const [dataset] = await collectSweep(
      [configured('json_web_key_parameters')],
      async () => 'Parameter Name,Used with kty Value\ncrv,EC\ncrv,OKP\n',
    );

    expect(dataset.entries.map((entry) => entry.entry_id)).toEqual([
      'crv | EC',
      'crv | OKP',
    ]);
  });

  it('makes OAuth extension error IDs unique by usage location', async () => {
    const [dataset] = await collectSweep(
      [configured('oauth_extensions_error_registry')],
      async () =>
        'Name,Usage Location\naccess_denied,authorization endpoint\naccess_denied,token endpoint\n',
    );

    expect(dataset.entries.map((entry) => entry.entry_id)).toEqual([
      'access_denied | authorization endpoint',
      'access_denied | token endpoint',
    ]);
  });

  it('makes OAuth parameter IDs unique by parameter usage location', async () => {
    const [dataset] = await collectSweep(
      [configured('oauth_parameters')],
      async () =>
        'Name,Parameter Usage Location\npct,authorization request\npct,token request\n',
    );

    expect(dataset.entries.map((entry) => entry.entry_id)).toEqual([
      'pct | authorization request',
      'pct | token request',
    ]);
  });
});
