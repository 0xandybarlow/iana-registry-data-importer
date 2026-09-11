import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const smokePackedPackage = async (
  tarball: string,
  typescriptExecutable: string,
): Promise<void> => {
  const consumer = await fs.mkdtemp(
    path.join(os.tmpdir(), 'iana-registry-data-smoke-'),
  );
  try {
    await fs.writeFile(
      path.join(consumer, 'package.json'),
      JSON.stringify({ private: true }, null, 2),
      'utf8',
    );
    const env = {
      ...process.env,
      npm_config_cache: path.join(consumer, '.npm-cache'),
    };
    await execFileAsync(
      'npm',
      ['install', '--ignore-scripts', path.resolve(tarball)],
      {
        cwd: consumer,
        env,
      },
    );
    await execFileAsync(
      'node',
      [
        '-e',
        "const p=require('iana-registry-data-lib'); for (const key of ['OAuth','JOSE','JWT']) { if (!p[key]) throw new Error(`missing ${key}`); }",
      ],
      { cwd: consumer },
    );
    await fs.writeFile(
      path.join(consumer, 'index.ts'),
      "import { OAuth, JOSE, JWT } from 'iana-registry-data-lib';\nimport type { RegistryDataset } from 'iana-registry-data-lib';\nconst sets: RegistryDataset[] = [OAuth.oauth_uri, JOSE.json_web_key_types, JWT.json_web_token_claims];\nconsole.log(sets.length);\n",
      'utf8',
    );
    await execFileAsync(
      typescriptExecutable,
      ['--noEmit', '--moduleResolution', 'node', 'index.ts'],
      { cwd: consumer },
    );
  } finally {
    await fs.rm(consumer, { recursive: true, force: true });
  }
};

if (require.main === module) {
  const [tarball, typescriptExecutable] = process.argv.slice(2);
  if (!tarball || !typescriptExecutable) {
    console.error(
      'Usage: smoke-packed-package <tarball> <typescript-executable>',
    );
    process.exitCode = 1;
  } else {
    smokePackedPackage(tarball, typescriptExecutable).catch(
      (error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      },
    );
  }
}
