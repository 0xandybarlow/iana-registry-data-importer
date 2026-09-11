import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  prepareDataRelease,
  PrepareDataReleaseOptions,
} from '../release/prepareDataRelease';
import { nextPatch, parseStableVersion } from '../release/semver';
import { UpdateSummaryDocument } from '../pipeline/types';

const summary = (
  overrides: Partial<UpdateSummaryDocument> = {},
): UpdateSummaryDocument => ({
  schema_version: 1,
  complete: true,
  diagnostic: false,
  changed: true,
  generated_at: '2026-09-11T01:02:03.000Z',
  datasets: [
    {
      registry_id: 'oauth_registry',
      dataset_id: 'oauth_uri',
      name: 'OAuth URI',
      hasChanges: true,
      added: [],
      removed: [],
      modified: [],
    },
  ],
  ...overrides,
});

const writeJson = (file: string, value: unknown): Promise<void> =>
  fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const createFixture = async (): Promise<string> => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'prepare-release-'));
  const dataDir = path.join(
    root,
    'iana-registry-data-lib/src/registries/oauth_registry',
  );
  await fs.mkdir(dataDir, { recursive: true });
  await writeJson(path.join(root, 'iana-registry-data-lib/package.json'), {
    name: 'iana-registry-data-lib',
    version: '3.0.1',
  });
  await writeJson(path.join(root, 'package-lock.json'), {
    lockfileVersion: 3,
    packages: {
      'iana-registry-data-lib': {
        name: 'iana-registry-data-lib',
        version: '3.0.1',
      },
    },
  });
  await fs.writeFile(
    path.join(root, 'iana-registry-data-lib/CHANGELOG.md'),
    '# Changelog\n\nAll notable changes are documented here.\n\n' +
      'The format is based on Keep a Changelog.\n\n' +
      '## [3.0.1] - 2026-05-27\n\n### Changed\n\n- Metadata.\n',
    'utf8',
  );
  await writeJson(path.join(dataDir, 'oauth_uri.json'), {
    schema_version: 2,
    registry_id: 'oauth_registry',
    dataset_id: 'oauth_uri',
    name: 'OAuth URI',
    metadata: {
      datasource_url: 'https://example.test/oauth.csv',
      required_specifications: [],
      last_updated_iso: '2026-09-11T01:02:03.000Z',
    },
    entries: [],
  });
  return root;
};

const options = (
  repositoryRoot: string,
  overrides: Partial<PrepareDataReleaseOptions> = {},
): PrepareDataReleaseOptions => ({
  repositoryRoot,
  summary: summary(),
  detailMarkdown:
    '## IANA Registry Data Updates\n\n### OAuth URI\n\n- Added: 1',
  prBodyPath: path.join(repositoryRoot, '.artifacts/data-release-pr.md'),
  now: () => new Date('2026-09-11T12:34:56.000Z'),
  updatePackageLock: async (root) => {
    const packageJson = JSON.parse(
      await fs.readFile(
        path.join(root, 'iana-registry-data-lib/package.json'),
        'utf8',
      ),
    ) as { version: string };
    const lockPath = path.join(root, 'package-lock.json');
    const lock = JSON.parse(await fs.readFile(lockPath, 'utf8')) as {
      packages: Record<string, { version: string }>;
    };
    lock.packages['iana-registry-data-lib'].version = packageJson.version;
    await writeJson(lockPath, lock);
  },
  ...overrides,
});

describe('stable semantic versions', () => {
  test.each([
    ['0.0.0', { major: 0, minor: 0, patch: 0 }],
    ['3.0.1', { major: 3, minor: 0, patch: 1 }],
    ['10.20.30', { major: 10, minor: 20, patch: 30 }],
  ])('parses %s', (value, expected) => {
    expect(parseStableVersion(value)).toEqual(expected);
  });

  test.each(['3.0.1-beta.1', '3.0.1+build.4', 'v3.0.1', '03.0.1'])(
    'rejects non-stable version %s',
    (value) => {
      expect(() => parseStableVersion(value)).toThrow('stable SemVer');
    },
  );

  test('increments exactly one patch, including decimal rollover', () => {
    expect(nextPatch('3.0.1')).toBe('3.0.2');
    expect(nextPatch('3.0.9')).toBe('3.0.10');
  });

  test('rejects prereleases when incrementing a patch', () => {
    expect(() => nextPatch('3.0.1-beta.1')).toThrow('stable SemVer');
  });
});

describe('prepareDataRelease', () => {
  let roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.map((root) => fs.rm(root, { recursive: true, force: true })),
    );
    roots = [];
  });

  test('increments the package and authoritative lock, prepends a dated Data section, and writes the explicit PR body', async () => {
    const root = await createFixture();
    roots.push(root);
    const result = await prepareDataRelease(options(root));

    expect(result).toEqual({
      version: '3.0.2',
      changelogSection:
        '## [3.0.2] - 2026-09-11\n\n### Data\n\n' +
        '## IANA Registry Data Updates\n\n### OAuth URI\n\n- Added: 1',
    });
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(root, 'iana-registry-data-lib/package.json'),
          'utf8',
        ),
      ),
    ).toMatchObject({ version: '3.0.2' });
    expect(
      JSON.parse(
        await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'),
      ).packages['iana-registry-data-lib'],
    ).toMatchObject({ version: '3.0.2' });
    expect(
      await fs.readFile(
        path.join(root, 'iana-registry-data-lib/CHANGELOG.md'),
        'utf8',
      ),
    ).toBe(
      '# Changelog\n\nAll notable changes are documented here.\n\n' +
        'The format is based on Keep a Changelog.\n\n' +
        '## [3.0.2] - 2026-09-11\n\n### Data\n\n' +
        '## IANA Registry Data Updates\n\n### OAuth URI\n\n- Added: 1\n\n' +
        '## [3.0.1] - 2026-05-27\n\n### Changed\n\n- Metadata.\n',
    );
    expect(
      await fs.readFile(
        path.join(root, '.artifacts/data-release-pr.md'),
        'utf8',
      ),
    ).toBe('## IANA Registry Data Updates\n\n### OAuth URI\n\n- Added: 1\n');
  });

  test.each([
    ['an incomplete summary', { complete: false }],
    ['a diagnostic summary', { diagnostic: true }],
    ['an unchanged summary', { changed: false }],
  ])('rejects %s without changing release files', async (_name, overrides) => {
    const root = await createFixture();
    roots.push(root);
    const packagePath = path.join(root, 'iana-registry-data-lib/package.json');
    const before = await fs.readFile(packagePath, 'utf8');

    await expect(
      prepareDataRelease(options(root, { summary: summary(overrides) })),
    ).rejects.toThrow('complete, non-diagnostic, changed summary');
    expect(await fs.readFile(packagePath, 'utf8')).toBe(before);
  });

  test('rejects an unsupported candidate schema before changing release files', async () => {
    const root = await createFixture();
    roots.push(root);
    const datasetPath = path.join(
      root,
      'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json',
    );
    const dataset = JSON.parse(await fs.readFile(datasetPath, 'utf8')) as {
      schema_version: number;
    };
    dataset.schema_version = 3;
    await writeJson(datasetPath, dataset);

    await expect(prepareDataRelease(options(root))).rejects.toThrow(
      'oauth_registry/oauth_uri: expected schema_version 2',
    );
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(root, 'iana-registry-data-lib/package.json'),
          'utf8',
        ),
      ).version,
    ).toBe('3.0.1');
  });

  test('validates schema 2 for unchanged candidates in the complete sweep', async () => {
    const root = await createFixture();
    roots.push(root);
    const changedPath = path.join(
      root,
      'iana-registry-data-lib/src/registries/oauth_registry/oauth_parameters.json',
    );
    await writeJson(changedPath, {
      schema_version: 2,
      registry_id: 'oauth_registry',
      dataset_id: 'oauth_parameters',
      entries: [],
    });
    const unchangedPath = path.join(
      root,
      'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json',
    );
    const unchanged = JSON.parse(await fs.readFile(unchangedPath, 'utf8')) as {
      schema_version: number;
    };
    unchanged.schema_version = 1;
    await writeJson(unchangedPath, unchanged);
    const completeSummary = summary({
      datasets: [
        { ...summary().datasets[0], hasChanges: false },
        {
          registry_id: 'oauth_registry',
          dataset_id: 'oauth_parameters',
          name: 'OAuth Parameters',
          hasChanges: true,
          added: [],
          removed: [],
          modified: [],
        },
      ],
    });

    await expect(
      prepareDataRelease(options(root, { summary: completeSummary })),
    ).rejects.toThrow('oauth_registry/oauth_uri: expected schema_version 2');
  });

  test('rejects a package and root-lock baseline mismatch before mutation', async () => {
    const root = await createFixture();
    roots.push(root);
    const lockPath = path.join(root, 'package-lock.json');
    const lock = JSON.parse(await fs.readFile(lockPath, 'utf8')) as {
      packages: Record<string, { version: string }>;
    };
    lock.packages['iana-registry-data-lib'].version = '3.0.0';
    await writeJson(lockPath, lock);

    await expect(prepareDataRelease(options(root))).rejects.toThrow(
      'checked-out package version 3.0.1 does not match root package-lock.json version 3.0.0',
    );
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(root, 'iana-registry-data-lib/package.json'),
          'utf8',
        ),
      ).version,
    ).toBe('3.0.1');
  });

  test('fails when the authoritative lock is not synchronized by npm', async () => {
    const root = await createFixture();
    roots.push(root);

    await expect(
      prepareDataRelease(
        options(root, { updatePackageLock: async () => undefined }),
      ),
    ).rejects.toThrow('root package-lock.json version does not match 3.0.2');
  });
});
