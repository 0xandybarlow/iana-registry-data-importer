import { extractVersionSection } from '../release/changelogSection';

const changelog =
  '# Changelog\n\n' +
  '## [3.0.20] - 2026-09-12\n\n### Data\n\n- Later.\n\n' +
  '## [3.0.2] - 2026-09-11\n\n### Data\n\n- Data update.\n\n' +
  '## [3.0.1] - 2026-05-27\n\n### Changed\n\n- Metadata.\n';

describe('extractVersionSection', () => {
  test('extracts exactly one matching version without prefix collisions', () => {
    expect(extractVersionSection(changelog, '3.0.2')).toBe(
      '## [3.0.2] - 2026-09-11\n\n### Data\n\n- Data update.',
    );
  });

  test.each([
    ['a missing version', '3.0.3', 'missing changelog section for 3.0.3'],
    [
      'a section without data',
      '3.0.1',
      'changelog section for 3.0.1 must contain a ### Data heading',
    ],
  ])('rejects %s', (_name, version, message) => {
    expect(() => extractVersionSection(changelog, version)).toThrow(message);
  });

  test('rejects duplicate version headings', () => {
    expect(() =>
      extractVersionSection(
        `${changelog}\n## [3.0.2] - 2026-09-13\n\n### Data\n\n- Duplicate.\n`,
        '3.0.2',
      ),
    ).toThrow('duplicate changelog sections for 3.0.2');
  });
});
