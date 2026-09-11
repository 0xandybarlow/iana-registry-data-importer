import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { nextPatch } from './semver';

const execFileAsync = promisify(execFile);

const REQUIRED_RELEASE_PATHS = [
  'iana-registry-data-lib/package.json',
  'iana-registry-data-lib/CHANGELOG.md',
  'package-lock.json',
] as const;
const DATASET_PATH =
  /^iana-registry-data-lib\/src\/registries\/[a-z0-9_]+\/[a-z0-9_]+\.json$/;

export interface ReleasePolicyOptions {
  changedPaths: string[];
  readBaseFile: (file: string) => Promise<string>;
  readHeadFile: (file: string) => Promise<string>;
}

interface VersionDocument {
  version?: unknown;
}

interface LockDocument {
  packages?: Record<string, { version?: unknown }>;
}

interface DatasetDocument {
  schema_version?: unknown;
}

export class ReleasePolicyError extends Error {
  constructor(readonly violations: string[]) {
    super(violations.map((violation) => `- ${violation}`).join('\n'));
    this.name = 'ReleasePolicyError';
  }
}

const isAllowedDataReleasePath = (file: string): boolean =>
  REQUIRED_RELEASE_PATHS.some((allowed) => file === allowed) ||
  DATASET_PATH.test(file);

export const assertAllowedDataReleasePaths = (files: string[]): void => {
  const violations = files
    .filter((file) => !isAllowedDataReleasePath(file))
    .map((file) => `unapproved automated release path: ${file}`);
  if (violations.length > 0) throw new ReleasePolicyError(violations);
};

const parseJson = <T>(value: string, file: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${file} must contain valid JSON`);
  }
};

const versionFrom = (value: string, file: string): string => {
  const version = parseJson<VersionDocument>(value, file).version;
  if (typeof version !== 'string') {
    throw new Error(`${file} must contain a string version`);
  }
  return version;
};

const releaseHasDataSection = (changelog: string, version: string): boolean => {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const header = new RegExp(
    `^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`,
    'm',
  );
  const match = header.exec(changelog);
  if (!match) return false;
  const remainder = changelog.slice(match.index + match[0].length);
  const nextRelease = remainder.search(/^## \[/m);
  const section =
    nextRelease === -1 ? remainder : remainder.slice(0, nextRelease);
  return /^### Data\s*$/m.test(section);
};

const captureViolation = async (
  violations: string[],
  operation: () => Promise<void>,
): Promise<void> => {
  try {
    await operation();
  } catch (error) {
    violations.push(error instanceof Error ? error.message : String(error));
  }
};

export const validateAutomatedRelease = async (
  options: ReleasePolicyOptions,
): Promise<void> => {
  const violations: string[] = [];
  try {
    assertAllowedDataReleasePaths(options.changedPaths);
  } catch (error) {
    if (error instanceof ReleasePolicyError) {
      violations.push(...error.violations);
    } else {
      throw error;
    }
  }

  for (const required of REQUIRED_RELEASE_PATHS) {
    if (!options.changedPaths.includes(required)) {
      violations.push(`automated data release must change ${required}`);
    }
  }
  const datasetPaths = options.changedPaths.filter((file) =>
    DATASET_PATH.test(file),
  );
  if (datasetPaths.length === 0) {
    violations.push(
      'automated data release must change at least one registry JSON file',
    );
  }

  for (const file of datasetPaths) {
    await captureViolation(violations, async () => {
      const [baseText, headText] = await Promise.all([
        options.readBaseFile(file),
        options.readHeadFile(file),
      ]);
      const base = parseJson<DatasetDocument>(baseText, `base ${file}`);
      const head = parseJson<DatasetDocument>(headText, file);
      if (
        base.schema_version !== 2 ||
        head.schema_version !== 2 ||
        base.schema_version !== head.schema_version
      ) {
        const shortPath = file.replace(
          'iana-registry-data-lib/src/registries/',
          '',
        );
        throw new Error(`${shortPath}: schema changes are not allowed`);
      }
    });
  }

  let headVersion: string | undefined;
  await captureViolation(violations, async () => {
    const packagePath = 'iana-registry-data-lib/package.json';
    const [basePackage, headPackage] = await Promise.all([
      options.readBaseFile(packagePath),
      options.readHeadFile(packagePath),
    ]);
    const baseVersion = versionFrom(basePackage, `base ${packagePath}`);
    headVersion = versionFrom(headPackage, packagePath);
    const expected = nextPatch(baseVersion);
    if (headVersion !== expected) {
      throw new Error(
        `expected library version ${expected}, received ${headVersion}`,
      );
    }
  });

  await captureViolation(violations, async () => {
    const lock = parseJson<LockDocument>(
      await options.readHeadFile('package-lock.json'),
      'package-lock.json',
    );
    const lockedVersion = lock.packages?.['iana-registry-data-lib']?.version;
    if (typeof headVersion !== 'string') return;
    if (lockedVersion !== headVersion) {
      throw new Error(
        `root package-lock.json version must match ${headVersion}`,
      );
    }
  });

  await captureViolation(violations, async () => {
    if (typeof headVersion !== 'string') return;
    const changelog = await options.readHeadFile(
      'iana-registry-data-lib/CHANGELOG.md',
    );
    if (!releaseHasDataSection(changelog, headVersion)) {
      throw new Error(
        `changelog must contain a ${headVersion} release with a ### Data section`,
      );
    }
  });

  if (violations.length > 0) throw new ReleasePolicyError(violations);
};

const cliOption = (name: string): string | undefined => {
  const prefix = `${name}=`;
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
};

if (require.main === module) {
  const baseRef = cliOption('--base') ?? cliOption('--base-ref');
  const repositoryRoot = path.resolve(
    cliOption('--repository-root') ?? path.join(__dirname, '../../../'),
  );

  if (!baseRef) {
    console.error('Usage: validate-data-release --base=<git-ref>');
    process.exitCode = 1;
  } else {
    execFileAsync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
      cwd: repositoryRoot,
    })
      .then(({ stdout }) =>
        validateAutomatedRelease({
          changedPaths: stdout.split('\n').filter(Boolean),
          readBaseFile: async (file) => {
            const result = await execFileAsync(
              'git',
              ['show', `${baseRef}:${file}`],
              { cwd: repositoryRoot },
            );
            return result.stdout;
          },
          readHeadFile: (file) =>
            fs.readFile(path.join(repositoryRoot, file), 'utf8'),
        }),
      )
      .then(() => console.log('Automated data release policy passed.'))
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      });
  }
}
