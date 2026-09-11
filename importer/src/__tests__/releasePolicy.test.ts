import {
  assertAllowedDataReleasePaths,
  ReleasePolicyOptions,
  validateAutomatedRelease,
} from '../release/releasePolicy';

const approvedPaths = [
  'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json',
  'iana-registry-data-lib/package.json',
  'iana-registry-data-lib/CHANGELOG.md',
  'package-lock.json',
];

const baseFiles: Record<string, string> = {
  'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json':
    JSON.stringify({ schema_version: 2, entries: [] }),
  'iana-registry-data-lib/package.json': JSON.stringify({ version: '3.0.1' }),
  'iana-registry-data-lib/CHANGELOG.md':
    '# Changelog\n\nKeep a Changelog.\n\n## [3.0.1] - 2026-05-27\n',
  'package-lock.json': JSON.stringify({
    packages: {
      'iana-registry-data-lib': { version: '3.0.1' },
    },
  }),
};

const headFiles: Record<string, string> = {
  'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json':
    JSON.stringify({ schema_version: 2, entries: [{ entry_id: 'new' }] }),
  'iana-registry-data-lib/package.json': JSON.stringify({ version: '3.0.2' }),
  'iana-registry-data-lib/CHANGELOG.md':
    '# Changelog\n\nKeep a Changelog.\n\n' +
    '## [3.0.2] - 2026-09-11\n\n### Data\n\n- OAuth URI changed.\n\n' +
    '## [3.0.1] - 2026-05-27\n',
  'package-lock.json': JSON.stringify({
    packages: {
      'iana-registry-data-lib': { version: '3.0.2' },
    },
  }),
};

const options = (
  base: Record<string, string> = baseFiles,
  head: Record<string, string> = headFiles,
  changedPaths: string[] = approvedPaths,
): ReleasePolicyOptions => ({
  changedPaths,
  readBaseFile: async (file) => {
    const value = base[file];
    if (value === undefined) throw new Error(`missing base fixture: ${file}`);
    return value;
  },
  readHeadFile: async (file) => {
    const value = head[file];
    if (value === undefined) throw new Error(`missing head fixture: ${file}`);
    return value;
  },
});

const replacing = (
  files: Record<string, string>,
  file: string,
  value: unknown,
): Record<string, string> => ({
  ...files,
  [file]: typeof value === 'string' ? value : JSON.stringify(value),
});

describe('assertAllowedDataReleasePaths', () => {
  test('accepts the complete literal automated data-release path set', () => {
    expect(() => assertAllowedDataReleasePaths(approvedPaths)).not.toThrow();
  });

  test.each([
    'importer/src/index.ts',
    'iana-registry-data-lib/README.md',
    'iana-registry-data-lib/package-lock.json',
    'iana-registry-data-lib/src/index.ts',
    'iana-registry-data-lib/src/registries/oauth_registry/index.ts',
    'iana-registry-data-lib/src/registries/oauth_registry/nested/oauth_uri.json',
  ])('rejects unapproved path %s', (file) => {
    expect(() => assertAllowedDataReleasePaths([file])).toThrow(
      `unapproved automated release path: ${file}`,
    );
  });
});

describe('validateAutomatedRelease', () => {
  test('accepts schema-2 data with an exact patch, synchronized lock, and matching Data changelog section', async () => {
    await expect(validateAutomatedRelease(options())).resolves.toBeUndefined();
  });

  test('rejects a dataset schema change', async () => {
    const head = replacing(headFiles, approvedPaths[0], {
      schema_version: 3,
      entries: [],
    });
    await expect(
      validateAutomatedRelease(options(baseFiles, head)),
    ).rejects.toThrow(
      'oauth_registry/oauth_uri.json: schema changes are not allowed',
    );
  });

  test.each([
    ['a skipped bump', '3.0.1'],
    ['a double bump', '3.0.3'],
    ['a minor bump', '3.1.0'],
  ])('rejects %s', async (_name, headVersion) => {
    const head = replacing(headFiles, 'iana-registry-data-lib/package.json', {
      version: headVersion,
    });
    await expect(
      validateAutomatedRelease(options(baseFiles, head)),
    ).rejects.toThrow(
      `expected library version 3.0.2, received ${headVersion}`,
    );
  });

  test('rejects a root lockfile version that differs from the package', async () => {
    const head = replacing(headFiles, 'package-lock.json', {
      packages: {
        'iana-registry-data-lib': { version: '3.0.1' },
      },
    });
    await expect(
      validateAutomatedRelease(options(baseFiles, head)),
    ).rejects.toThrow('root package-lock.json version must match 3.0.2');
  });

  test('rejects a changelog without a matching Data section', async () => {
    const head = replacing(
      headFiles,
      'iana-registry-data-lib/CHANGELOG.md',
      '# Changelog\n\n## [3.0.2] - 2026-09-11\n\n### Changed\n\n- Other.\n',
    );
    await expect(
      validateAutomatedRelease(options(baseFiles, head)),
    ).rejects.toThrow(
      'changelog must contain a 3.0.2 release with a ### Data section',
    );
  });

  test('reports every independent violation in one validation result', async () => {
    const head = {
      ...headFiles,
      [approvedPaths[0]]: JSON.stringify({ schema_version: 3 }),
      'iana-registry-data-lib/package.json': JSON.stringify({
        version: '3.0.3',
      }),
      'package-lock.json': JSON.stringify({
        packages: { 'iana-registry-data-lib': { version: '3.0.1' } },
      }),
      'iana-registry-data-lib/CHANGELOG.md': '# Changelog\n',
    };

    await expect(
      validateAutomatedRelease(options(baseFiles, head)),
    ).rejects.toThrow(
      /schema changes are not allowed[\s\S]*expected library version 3\.0\.2[\s\S]*root package-lock\.json version must match 3\.0\.3[\s\S]*changelog must contain a 3\.0\.3 release/,
    );
  });
});
