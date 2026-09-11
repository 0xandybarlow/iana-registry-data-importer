import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { UpdateSummaryDocument } from '../pipeline/types';
import { nextPatch } from './semver';

const execFileAsync = promisify(execFile);

export type UpdatePackageLock = (repositoryRoot: string) => Promise<void>;

export interface PrepareDataReleaseOptions {
  repositoryRoot: string;
  summary: UpdateSummaryDocument;
  detailMarkdown: string;
  prBodyPath: string;
  now?: () => Date;
  updatePackageLock?: UpdatePackageLock;
}

interface PackageDocument {
  version?: unknown;
  [key: string]: unknown;
}

interface LockDocument {
  packages?: Record<string, { version?: unknown }>;
}

const readJson = async <T>(file: string): Promise<T> =>
  JSON.parse(await fs.readFile(file, 'utf8')) as T;

const writeJson = (file: string, value: unknown): Promise<void> =>
  fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const defaultUpdatePackageLock: UpdatePackageLock = async (repositoryRoot) => {
  await execFileAsync(
    'npm',
    ['install', '--package-lock-only', '--ignore-scripts'],
    { cwd: repositoryRoot },
  );
};

const validateSummary = (summary: UpdateSummaryDocument): void => {
  if (
    summary.schema_version !== 1 ||
    !summary.complete ||
    summary.diagnostic ||
    !summary.changed ||
    !summary.datasets.some((dataset) => dataset.hasChanges)
  ) {
    throw new Error(
      'Data release preparation requires a complete, non-diagnostic, changed summary',
    );
  }
};

const validateCandidateSchemas = async (
  repositoryRoot: string,
  summary: UpdateSummaryDocument,
): Promise<void> => {
  for (const candidate of summary.datasets) {
    const identifier = `${candidate.registry_id}/${candidate.dataset_id}`;
    const file = path.join(
      repositoryRoot,
      'iana-registry-data-lib/src/registries',
      candidate.registry_id,
      `${candidate.dataset_id}.json`,
    );
    const dataset = await readJson<{ schema_version?: unknown }>(file);
    if (dataset.schema_version !== 2) {
      throw new Error(`${identifier}: expected schema_version 2`);
    }
  }
};

const prependRelease = (
  changelog: string,
  changelogSection: string,
): string => {
  const firstRelease = changelog.search(/^## \[/m);
  if (firstRelease === -1) {
    return `${changelog.trimEnd()}\n\n${changelogSection}\n`;
  }
  const introduction = changelog.slice(0, firstRelease).trimEnd();
  const releases = changelog.slice(firstRelease).trimStart();
  return `${introduction}\n\n${changelogSection}\n\n${releases}`;
};

const requiredString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

export const prepareDataRelease = async (
  options: PrepareDataReleaseOptions,
): Promise<{ version: string; changelogSection: string }> => {
  validateSummary(options.summary);
  await validateCandidateSchemas(options.repositoryRoot, options.summary);

  const packagePath = path.join(
    options.repositoryRoot,
    'iana-registry-data-lib/package.json',
  );
  const lockPath = path.join(options.repositoryRoot, 'package-lock.json');
  const changelogPath = path.join(
    options.repositoryRoot,
    'iana-registry-data-lib/CHANGELOG.md',
  );
  const packageDocument = await readJson<PackageDocument>(packagePath);
  const currentVersion = requiredString(
    packageDocument.version,
    'iana-registry-data-lib package version',
  );
  const initialLock = await readJson<LockDocument>(lockPath);
  const lockedVersion =
    initialLock.packages?.['iana-registry-data-lib']?.version;
  if (lockedVersion !== currentVersion) {
    throw new Error(
      `checked-out package version ${currentVersion} does not match root package-lock.json version ${String(lockedVersion)}`,
    );
  }
  const version = nextPatch(currentVersion);
  const date = (options.now ?? (() => new Date()))().toISOString().slice(0, 10);
  const detailMarkdown = options.detailMarkdown.trim();
  if (!detailMarkdown) {
    throw new Error('Generated Markdown detail must not be empty');
  }
  if (!options.prBodyPath) {
    throw new Error('An explicit PR body output path is required');
  }
  const changelogSection = `## [${version}] - ${date}\n\n### Data\n\n${detailMarkdown}`;
  const changelog = await fs.readFile(changelogPath, 'utf8');

  packageDocument.version = version;
  await writeJson(packagePath, packageDocument);
  await (options.updatePackageLock ?? defaultUpdatePackageLock)(
    options.repositoryRoot,
  );

  const lock = await readJson<LockDocument>(lockPath);
  if (lock.packages?.['iana-registry-data-lib']?.version !== version) {
    throw new Error(
      `root package-lock.json version does not match ${version}; run npm install --package-lock-only --ignore-scripts at the repository root`,
    );
  }

  await fs.writeFile(
    changelogPath,
    prependRelease(changelog, changelogSection),
    'utf8',
  );
  await fs.mkdir(path.dirname(options.prBodyPath), { recursive: true });
  await fs.writeFile(options.prBodyPath, `${detailMarkdown}\n`, 'utf8');

  return { version, changelogSection };
};

const cliOption = (name: string): string | undefined => {
  const prefix = `${name}=`;
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
};

if (require.main === module) {
  const repositoryRoot = path.resolve(
    cliOption('--repository-root') ?? path.join(__dirname, '../../../'),
  );
  const summaryPath = cliOption('--summary');
  const detailPath = cliOption('--detail');
  const prBodyPath = cliOption('--pr-body');

  if (!summaryPath || !detailPath || !prBodyPath) {
    console.error(
      'Usage: prepare-data-release --summary=<path> --detail=<path> --pr-body=<path>',
    );
    process.exitCode = 1;
  } else {
    Promise.all([
      readJson<UpdateSummaryDocument>(path.resolve(summaryPath)),
      fs.readFile(path.resolve(detailPath), 'utf8'),
    ])
      .then(([summary, detailMarkdown]) =>
        prepareDataRelease({
          repositoryRoot,
          summary,
          detailMarkdown,
          prBodyPath: path.resolve(prBodyPath),
        }),
      )
      .then(({ version }) => console.log(`Prepared data release ${version}.`))
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      });
  }
}
