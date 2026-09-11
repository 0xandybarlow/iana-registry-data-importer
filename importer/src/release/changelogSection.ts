import { promises as fs } from 'fs';

const headingFor = (version: string): RegExp => {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`, 'gm');
};

export const extractVersionSection = (
  changelog: string,
  version: string,
): string => {
  const matches = [...changelog.matchAll(headingFor(version))];
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `missing changelog section for ${version}`
        : `duplicate changelog sections for ${version}`,
    );
  }
  const start = matches[0].index ?? 0;
  const remaining = changelog.slice(start);
  const next = remaining.slice(matches[0][0].length).search(/^## \[/m);
  const section =
    next === -1
      ? remaining.trimEnd()
      : remaining.slice(0, matches[0][0].length + next).trimEnd();
  if (!/^### Data\s*$/m.test(section)) {
    throw new Error(
      `changelog section for ${version} must contain a ### Data heading`,
    );
  }
  return section;
};

if (require.main === module) {
  const [changelogPath, version] = process.argv.slice(2);
  if (!changelogPath || !version) {
    console.error('Usage: release-notes <changelog-path> <version>');
    process.exitCode = 1;
  } else {
    fs.readFile(changelogPath, 'utf8')
      .then((changelog) =>
        console.log(extractVersionSection(changelog, version)),
      )
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
      });
  }
}
