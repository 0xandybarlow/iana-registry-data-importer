#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, onFile) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, onFile);
    } else if (entry.isFile()) {
      await onFile(entryPath);
    }
  }
}

async function minifyJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    error.message = `Failed to parse JSON in ${filePath}: ${error.message}`;
    throw error;
  }
  const minified = JSON.stringify(parsed);
  if (raw.length !== minified.length) {
    await fs.writeFile(filePath, minified, 'utf8');
  }
  return raw.length - minified.length;
}

async function removeFile(filePath) {
  await fs.unlink(filePath);
}

async function main() {
  if (!(await pathExists(distDir))) {
    return;
  }
  let bytesSaved = 0;
  const removedFiles = [];

  await walk(distDir, async (filePath) => {
    if (filePath.endsWith(`${path.sep}types.js`)) {
      await removeFile(filePath);
      removedFiles.push(path.relative(distDir, filePath));
      return;
    }
    if (filePath.endsWith('.json')) {
      bytesSaved += await minifyJson(filePath);
    }
  });

  if (bytesSaved > 0 || removedFiles.length > 0) {
    const summary = [];
    if (bytesSaved > 0) {
      summary.push(`minified JSON saved ${bytesSaved} bytes`);
    }
    if (removedFiles.length > 0) {
      summary.push(`removed ${removedFiles.length} type stub(s)`);
    }
    if (summary.length > 0) {
      console.log(`[finalize-dist] ${summary.join('; ')}`);
    }
  }
}

main().catch((error) => {
  console.error('[finalize-dist] failed');
  console.error(error);
  process.exitCode = 1;
});
