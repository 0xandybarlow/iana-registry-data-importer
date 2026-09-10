import { promises as fs } from 'fs';
import path from 'path';
import { DatasourceConfig, REGISTRIES } from './sources';
import { RegistryDataset } from './types';
import { validateDatasetSet, validateDatasetWithOptions } from './validate';

export interface LegacyValidationOptions {
  allowLegacy301Duplicates?: boolean;
  libraryVersion?: string;
}

const LEGACY_301_DUPLICATES: Readonly<Record<string, ReadonlySet<string>>> = {
  'jose_registry/json_web_key_parameters': new Set(['crv', 'd', 'x']),
  'oauth_registry/oauth_extensions_error_registry': new Set(['access_denied']),
  'oauth_registry/oauth_parameters': new Set(['pct']),
};

const readCommittedDataset = async (
  dataRoot: string,
  config: DatasourceConfig,
): Promise<unknown> => {
  const label = `${config.registry_id}/${config.dataset_id}`;
  const file = path.join(
    dataRoot,
    config.registry_id,
    `${config.dataset_id}.json`,
  );
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as unknown;
  } catch {
    throw new Error(`${label}: unable to read committed dataset`);
  }
};

export const validateCommittedDatasets = async (
  dataRoot: string,
  configs: DatasourceConfig[],
  options: LegacyValidationOptions = {},
): Promise<void> => {
  const compatibilityEnabled =
    options.allowLegacy301Duplicates === true &&
    options.libraryVersion === '3.0.1';
  const datasets: RegistryDataset[] = [];

  for (const config of configs) {
    const label = `${config.registry_id}/${config.dataset_id}`;
    const value = await readCommittedDataset(dataRoot, config);
    datasets.push(
      validateDatasetWithOptions(value, config, {
        allowedDuplicateEntryIds: compatibilityEnabled
          ? LEGACY_301_DUPLICATES[label]
          : undefined,
      }),
    );
  }

  validateDatasetSet(datasets, configs);
};

const optionValue = (argv: string[], name: string): string | undefined => {
  const option = argv.find((argument) => argument.startsWith(`${name}=`));
  return option?.slice(name.length + 1);
};

const DEFAULT_DATA_ROOT = path.resolve(
  __dirname,
  '../../../iana-registry-data-lib/src/registries',
);

const DEFAULT_PACKAGE_JSON = path.resolve(
  __dirname,
  '../../../iana-registry-data-lib/package.json',
);

export const runValidateCommittedCli = async (
  argv: string[] = process.argv.slice(2),
  configs: DatasourceConfig[] = REGISTRIES.flatMap(
    (registry) => registry.sources,
  ),
): Promise<void> => {
  const dataRoot = path.resolve(
    optionValue(argv, '--data-root') ?? DEFAULT_DATA_ROOT,
  );
  const packageJsonPath = path.resolve(
    optionValue(argv, '--package-json') ?? DEFAULT_PACKAGE_JSON,
  );
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf8'),
  ) as { version?: unknown };
  const libraryVersion =
    typeof packageJson.version === 'string' ? packageJson.version : undefined;

  await validateCommittedDatasets(dataRoot, configs, {
    allowLegacy301Duplicates: argv.includes('--allow-legacy-3.0.1-duplicates'),
    libraryVersion,
  });
};

if (require.main === module) {
  runValidateCommittedCli()
    .then(() => {
      console.log('Committed registry datasets are valid.');
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
