import { normalizeCsvRecord, stableSlug } from '../v2/normalize';

describe('normalize & slug', () => {
  it('creates stable entry_id from primary key', () => {
    const rec = { 'Claim Name': 'iss', 'Claim Description': 'Issuer', Reference: '[RFC7519]' };
    const e = normalizeCsvRecord(rec, ['Claim Name']);
    expect(e.entry_id).toBe('iss');
  });

  it('preserves raw when slug would be empty (e.g., "...")', () => {
    const rec = { 'Claim Name': '...', 'Claim Description': 'Digest of the Disclosure for an array element' };
    const e = normalizeCsvRecord(rec, ['Claim Name']);
    expect(e.entry_id).toBe('...');
  });

  it('stableSlug preserves raw punctuation-only', () => {
    expect(stableSlug('...')).toBe('...');
  });
});
