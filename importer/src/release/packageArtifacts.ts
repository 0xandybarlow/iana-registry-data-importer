import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface PackageManifestEntry {
  path: string;
  sha256: string;
}

const REQUIRED_FILES = [
  'package/package.json',
  'package/README.md',
  'package/LICENSE.md',
  'package/dist/index.js',
  'package/dist/index.d.ts',
] as const;
const ALLOWED_FILE =
  /^(package\/(package\.json|README\.md|LICENSE\.md)|package\/dist\/.+)$/;
const REGISTRY_JSON =
  /^package\/dist\/registries\/[a-z0-9_]+\/[a-z0-9_]+\.json$/;

const toPosixRelativePath = (root: string, file: string): string =>
  path.relative(root, file).split(path.sep).join('/');

const filesBelow = async (root: string): Promise<string[]> => {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(root, entry.name);
      if (entry.isDirectory()) return filesBelow(file);
      if (entry.isFile()) return [file];
      return [];
    }),
  );
  return nested.flat();
};

export const canonicalManifest = async (
  root: string,
): Promise<PackageManifestEntry[]> => {
  const files = await filesBelow(root);
  return Promise.all(
    files
      .map((file) => ({ file, path: toPosixRelativePath(root, file) }))
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(async ({ file, path: relativePath }) => ({
        path: relativePath,
        sha256: createHash('sha256')
          .update(await fs.readFile(file))
          .digest('hex'),
      })),
  );
};

export const assertPublishFileList = (files: string[]): void => {
  for (const file of files) {
    if (!ALLOWED_FILE.test(file)) {
      throw new Error(`unexpected package file: ${file}`);
    }
  }
  for (const file of REQUIRED_FILES) {
    if (!files.includes(file))
      throw new Error(`missing required package file: ${file}`);
  }
  if (!files.some((file) => REGISTRY_JSON.test(file))) {
    throw new Error('missing registry JSON file in package');
  }
};

const readStdin = async (): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
};

const main = async (): Promise<void> => {
  const [command, value] = process.argv.slice(2);
  if (command === 'package-manifest' && value) {
    console.log(
      JSON.stringify(await canonicalManifest(path.resolve(value)), null, 2),
    );
    return;
  }
  if (command === 'inspect-pack') {
    const packed = JSON.parse(await readStdin()) as Array<{
      files?: Array<{ path?: unknown }>;
    }>;
    const files = packed.flatMap((entry) =>
      (entry.files ?? []).flatMap((file) =>
        typeof file.path === 'string' ? [`package/${file.path}`] : [],
      ),
    );
    assertPublishFileList(files);
    console.log('Packed package file list passed.');
    return;
  }
  throw new Error(
    'Usage: package-manifest <directory> | inspect-pack < npm-pack.json',
  );
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
