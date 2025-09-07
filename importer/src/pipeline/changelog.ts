import { DatasetChangeSummary, FieldChange } from './types';

const renderFieldChange = (c: FieldChange): string => {
  const ov = c.oldValue === undefined ? '∅' : JSON.stringify(c.oldValue);
  const nv = c.newValue === undefined ? '∅' : JSON.stringify(c.newValue);
  return `- ${c.field}: ${ov} → ${nv}`;
};

export const renderDatasetChangelog = (sum: DatasetChangeSummary): string => {
  if (!sum.hasChanges) return '';
  const lines: string[] = [];
  lines.push(`### ${sum.name} (${sum.registry_id}/${sum.dataset_id})`);
  if (sum.formatUpgraded) {
    lines.push(`- Format: upgraded to v2 schema`);
  }
  if (sum.added.length) lines.push(`- Added: ${sum.added.length}`);
  if (sum.removed.length) lines.push(`- Removed: ${sum.removed.length}`);
  if (sum.modified.length) {
    lines.push(`- Modified: ${sum.modified.length}`);
    for (const m of sum.modified.slice(0, 20)) {
      lines.push(`  - entry_id=${m.entry_id}`);
      for (const ch of m.changes || [])
        lines.push(`    ${renderFieldChange(ch)}`);
    }
    if (sum.modified.length > 20)
      lines.push(`  - …and ${sum.modified.length - 20} more modifications`);
  }
  lines.push('');
  return lines.join('\n');
};

export const renderChangelogBody = (
  summaries: DatasetChangeSummary[],
): string => {
  const parts = summaries
    .filter((s) => s.hasChanges)
    .map(renderDatasetChangelog)
    .filter(Boolean);
  if (parts.length === 0) return 'No data changes detected.';
  return ['## IANA Registry Data Updates', '', ...parts].join('\n');
};
