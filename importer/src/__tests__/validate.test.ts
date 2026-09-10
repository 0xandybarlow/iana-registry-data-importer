import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { DatasourceConfig } from '../pipeline/sources';
import { RegistryDataset, RegistryEntry } from '../pipeline/types';
import { validateDataset, validateDatasetSet } from '../pipeline/validate';
import {
  runValidateCommittedCli,
  validateCommittedDatasets,
} from '../pipeline/validateCommitted';

const identity = {
  registry_id: 'test_registry',
  dataset_id: 'test_dataset',
};

const makeDataset = (entries: RegistryEntry[]): RegistryDataset => ({
  schema_version: 2,
  registry_id: 'test_registry',
  dataset_id: 'test_dataset',
  name: 'Test Dataset',
  metadata: {
    datasource_url: 'https://example.test/data.csv',
    required_specifications: ['RFC0000'],
    last_updated_iso: '2026-09-11T00:00:00.000Z',
  },
  entries,
});

const config = (registry_id: string, dataset_id: string): DatasourceConfig => ({
  registry_id,
  dataset_id,
  name: dataset_id,
  url: `https://example.test/${dataset_id}.csv`,
  required_specifications: [],
});

describe('validateDataset', () => {
  it('accepts a valid schema version 2 dataset', () => {
    const dataset = makeDataset([{ entry_id: 'one', name: 'One' }]);

    expect(validateDataset(dataset, identity)).toBe(dataset);
  });

  it('rejects the wrong configured identity', () => {
    const dataset = {
      ...makeDataset([{ entry_id: 'one', name: 'One' }]),
      dataset_id: 'wrong_dataset',
    };

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: identity mismatch',
    );
  });

  it('rejects an unsupported schema version', () => {
    const dataset = {
      ...makeDataset([{ entry_id: 'one', name: 'One' }]),
      schema_version: 1,
    };

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: unsupported schema_version',
    );
  });

  it('rejects empty entries', () => {
    expect(() => validateDataset(makeDataset([]), identity)).toThrow(
      'test_registry/test_dataset: entries must be non-empty',
    );
  });

  it('rejects blank entry IDs', () => {
    const dataset = makeDataset([{ entry_id: '  ', name: 'Blank' }]);

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: blank entry_id',
    );
  });

  it('rejects duplicate entry IDs', () => {
    const dataset = makeDataset([
      { entry_id: 'same', name: 'A' },
      { entry_id: 'same', name: 'B' },
    ]);

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: duplicate entry_id "same"',
    );
  });

  it('rejects malformed metadata without coercion', () => {
    const dataset = {
      ...makeDataset([{ entry_id: 'one', name: 'One' }]),
      metadata: {
        datasource_url: 'https://example.test/data.csv',
        required_specifications: 'RFC0000',
        last_updated_iso: '2026-09-11T00:00:00.000Z',
      },
    };

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: invalid metadata',
    );
  });

  it('rejects a non-string dataset name without coercion', () => {
    const dataset = {
      ...makeDataset([{ entry_id: 'one', name: 'One' }]),
      name: 42,
    };

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: invalid name',
    );
  });

  it('rejects a non-object entry without coercion', () => {
    const dataset = {
      ...makeDataset([{ entry_id: 'one', name: 'One' }]),
      entries: [null],
    };

    expect(() => validateDataset(dataset, identity)).toThrow(
      'test_registry/test_dataset: invalid entry',
    );
  });
});

describe('validateDatasetSet', () => {
  it('rejects an incomplete configured dataset set', () => {
    const configs = [
      config('test_registry', 'first'),
      config('test_registry', 'second'),
    ];
    const datasets = [
      {
        ...makeDataset([{ entry_id: 'one', name: 'One' }]),
        dataset_id: 'first',
      },
    ];

    expect(() => validateDatasetSet(datasets, configs)).toThrow(
      'test_registry/second: missing configured dataset',
    );
  });

  it('rejects an extra unconfigured dataset', () => {
    const configs = [config('test_registry', 'first')];
    const datasets = [
      {
        ...makeDataset([{ entry_id: 'one', name: 'One' }]),
        dataset_id: 'first',
      },
      {
        ...makeDataset([{ entry_id: 'two', name: 'Two' }]),
        dataset_id: 'extra',
      },
    ];

    expect(() => validateDatasetSet(datasets, configs)).toThrow(
      'test_registry/extra: unconfigured dataset',
    );
  });

  it('rejects a duplicate configured dataset', () => {
    const configs = [config('test_registry', 'first')];
    const datasets = [
      {
        ...makeDataset([{ entry_id: 'one', name: 'One' }]),
        dataset_id: 'first',
      },
      {
        ...makeDataset([{ entry_id: 'two', name: 'Two' }]),
        dataset_id: 'first',
      },
    ];

    expect(() => validateDatasetSet(datasets, configs)).toThrow(
      'test_registry/first: duplicate dataset',
    );
  });
});

describe('validateCommittedDatasets legacy compatibility', () => {
  let dataRoot: string;

  beforeEach(async () => {
    dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'iana-validation-'));
  });

  afterEach(async () => {
    await fs.rm(dataRoot, { recursive: true, force: true });
  });

  const writeDataset = async (
    registryId: string,
    datasetId: string,
    entries: RegistryEntry[],
  ) => {
    const directory = path.join(dataRoot, registryId);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, `${datasetId}.json`),
      JSON.stringify({
        schema_version: 2,
        registry_id: registryId,
        dataset_id: datasetId,
        name: datasetId,
        metadata: {
          datasource_url: `https://example.test/${datasetId}.csv`,
          required_specifications: [],
          last_updated_iso: '2026-09-11T00:00:00.000Z',
        },
        entries,
      }),
      'utf8',
    );
  };

  it('keeps committed-data validation strict by default', async () => {
    await writeDataset('jose_registry', 'json_web_key_parameters', [
      { entry_id: 'crv', parameter_name: 'crv' },
      { entry_id: 'crv', parameter_name: 'crv' },
    ]);

    await expect(
      validateCommittedDatasets(dataRoot, [
        config('jose_registry', 'json_web_key_parameters'),
      ]),
    ).rejects.toThrow(
      'jose_registry/json_web_key_parameters: duplicate entry_id "crv"',
    );
  });

  it('allows only known 3.0.1 duplicate IDs when compatibility is explicit', async () => {
    const configs = [
      config('jose_registry', 'json_web_key_parameters'),
      config('oauth_registry', 'oauth_extensions_error_registry'),
      config('oauth_registry', 'oauth_parameters'),
    ];
    await writeDataset('jose_registry', 'json_web_key_parameters', [
      { entry_id: 'crv', parameter_name: 'crv' },
      { entry_id: 'crv', parameter_name: 'crv' },
      { entry_id: 'd', parameter_name: 'd' },
      { entry_id: 'd', parameter_name: 'd' },
      { entry_id: 'x', parameter_name: 'x' },
      { entry_id: 'x', parameter_name: 'x' },
    ]);
    await writeDataset('oauth_registry', 'oauth_extensions_error_registry', [
      { entry_id: 'access_denied', name: 'access_denied' },
      { entry_id: 'access_denied', name: 'access_denied' },
    ]);
    await writeDataset('oauth_registry', 'oauth_parameters', [
      { entry_id: 'pct', name: 'pct' },
      { entry_id: 'pct', name: 'pct' },
    ]);

    await expect(
      validateCommittedDatasets(dataRoot, configs, {
        allowLegacy301Duplicates: true,
        libraryVersion: '3.0.1',
      }),
    ).resolves.toBeUndefined();
  });

  it('enables the 3.0.1 compatibility path only through the explicit CLI flag', async () => {
    const configs = [config('jose_registry', 'json_web_key_parameters')];
    const packagePath = path.join(dataRoot, 'package.json');
    await fs.writeFile(
      packagePath,
      JSON.stringify({ version: '3.0.1' }),
      'utf8',
    );
    await writeDataset('jose_registry', 'json_web_key_parameters', [
      { entry_id: 'crv', parameter_name: 'crv' },
      { entry_id: 'crv', parameter_name: 'crv' },
    ]);

    await expect(
      runValidateCommittedCli(
        [
          `--data-root=${dataRoot}`,
          `--package-json=${packagePath}`,
          '--allow-legacy-3.0.1-duplicates',
        ],
        configs,
      ),
    ).resolves.toBeUndefined();

    await expect(
      runValidateCommittedCli(
        [`--data-root=${dataRoot}`, `--package-json=${packagePath}`],
        configs,
      ),
    ).rejects.toThrow(
      'jose_registry/json_web_key_parameters: duplicate entry_id "crv"',
    );
  });

  it('rejects compatibility mode for a later library version', async () => {
    await writeDataset('jose_registry', 'json_web_key_parameters', [
      { entry_id: 'crv', parameter_name: 'crv' },
      { entry_id: 'crv', parameter_name: 'crv' },
    ]);

    await expect(
      validateCommittedDatasets(
        dataRoot,
        [config('jose_registry', 'json_web_key_parameters')],
        {
          allowLegacy301Duplicates: true,
          libraryVersion: '3.0.2',
        },
      ),
    ).rejects.toThrow(
      'jose_registry/json_web_key_parameters: duplicate entry_id "crv"',
    );
  });

  it('rejects an unrecognized duplicate in 3.0.1 compatibility mode', async () => {
    await writeDataset('jose_registry', 'json_web_key_parameters', [
      { entry_id: 'unexpected', parameter_name: 'unexpected' },
      { entry_id: 'unexpected', parameter_name: 'unexpected' },
    ]);

    await expect(
      validateCommittedDatasets(
        dataRoot,
        [config('jose_registry', 'json_web_key_parameters')],
        {
          allowLegacy301Duplicates: true,
          libraryVersion: '3.0.1',
        },
      ),
    ).rejects.toThrow(
      'jose_registry/json_web_key_parameters: duplicate entry_id "unexpected"',
    );
  });
});
