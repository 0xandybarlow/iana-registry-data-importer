import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  assertPublishFileList,
  canonicalManifest,
} from '../release/packageArtifacts';

describe('canonicalManifest', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.map((root) => fs.rm(root, { recursive: true, force: true })),
    );
    roots.length = 0;
  });

  const fixture = async (): Promise<string> => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'package-manifest-'));
    roots.push(root);
    await fs.mkdir(path.join(root, 'nested'), { recursive: true });
    await fs.writeFile(path.join(root, 'nested', 'two.txt'), 'two', 'utf8');
    await fs.writeFile(path.join(root, 'one.txt'), 'one', 'utf8');
    return root;
  };

  test('sorts normalized relative paths and hashes file bytes', async () => {
    const root = await fixture();
    expect(await canonicalManifest(root)).toEqual([
      {
        path: 'nested/two.txt',
        sha256:
          '3fc4ccfe745870e2c0d99f71f30ff0656c8dedd41cc1d7d3d376b0dbe685e2f3',
      },
      {
        path: 'one.txt',
        sha256:
          '7692c3ad3540bb803c020b3aee66cd8887123234ea0c6e7143c0add73ff431ed',
      },
    ]);
  });

  test('changes only the hash for changed file content', async () => {
    const root = await fixture();
    const before = await canonicalManifest(root);
    await fs.writeFile(path.join(root, 'one.txt'), 'changed', 'utf8');
    const after = await canonicalManifest(root);
    expect(after.map((entry) => entry.path)).toEqual(
      before.map((entry) => entry.path),
    );
    expect(after[1].sha256).not.toBe(before[1].sha256);
  });
});

describe('assertPublishFileList', () => {
  const valid = [
    'package/package.json',
    'package/README.md',
    'package/LICENSE.md',
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/registries/oauth_registry/oauth_uri.json',
  ];

  test('accepts the required package files and generated data', () => {
    expect(() => assertPublishFileList(valid)).not.toThrow();
  });

  test.each([
    ['package/.env', 'unexpected package file: package/.env'],
    ['package/src/index.ts', 'unexpected package file: package/src/index.ts'],
    [
      'package/dist/index.js',
      'missing required package file: package/package.json',
    ],
  ])('rejects %s', (file, expected) => {
    const files = file === 'package/dist/index.js' ? [file] : [...valid, file];
    expect(() => assertPublishFileList(files)).toThrow(expected);
  });
});
