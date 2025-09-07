# iana-registry-data v2 Plan

## Goals
- Automate end-to-end: fetch → parse → compare → open PR (with changelog) → publish.
- Redesign JSON schema for stability, determinism, and clarity (v2 breaking).
- Smarter change detection (ignore noise; classify meaningful changes).
- Reliable CI, scheduled data updates, and one-click/npm-tag publishing.

## Repo Structure (Monorepo)
- `importer/`: TypeScript importer CLI and utilities for fetching/parsing/diffing.
- `iana-registry-data-lib/`: Published library containing generated JSON + typed exports.
- `.github/workflows/`: CI, scheduled update, and release pipelines.

## v2 Data Model
- Schema (top-level fields):
  - `schema_version: 2`.
  - `registry_id`: stable snake_case (e.g., `oauth_registry`).
  - `dataset_id`: stable snake_case (e.g., `oauth_parameters`).
  - `name`: human label of dataset.
  - `metadata`: `{ datasource_url, required_specifications, last_updated_iso }`.
  - `entries`: array of normalized entries (see below).
- Entry normalization:
  - Lower_snake_case keys; trimmed whitespace; bracket cleanup; consistent punctuation.
  - Deterministic sorting: entries sorted by a primary key (e.g., `name` or `value`).
  - Deterministic object key order when serializing.
  - `entry_id`: derived stable slug from the primary key fields.
- File layout:
  - `iana-registry-data-lib/src/registries/<registry_id>/<dataset_id>.json`.
  - Index per registry exporting datasets; root index re-exports registries + types.

## Change Detection (Semantic)
- Normalize both previous and new datasets before comparing.
- Ignore noise:
  - Field order and array order differences if content identical.
  - `last_updated_iso` differences.
  - Insignificant whitespace changes.
- Classify changes:
  - `entry_added`, `entry_removed`.
  - `field_changed` with old→new per field (tracked by `entry_id`).
  - Specific subtypes when possible: `reference_added/removed`, `status_changed`, `description_changed`.
- Diff output feeds changelog generator and PR body.

## Automation
- CI (`ci.yml`):
  - Node 20; install, build, lint, and test both workspaces.
- Scheduled Update (`update-data.yml`):
  - Run importer `check-and-update` on schedule/dispatch.
  - If changes detected: write JSON, create changelog entry, open PR via `peter-evans/create-pull-request`.
  - If no changes: skip PR.
- Release (`release.yml`):
  - On tag or GitHub Release: build `iana-registry-data-lib` and `npm publish`.
  - Optionally integrate Changesets for automated versioning; for v2 we’ll bump manually once.

## Library v2 API
- Export types:
  - `RegistryDataset`, `RegistryEntry`, `ChangeSummary`.
- Export data:
  - Named exports per registry: `OAuth`, `JOSE`, `JWT` with dataset properties.
  - Also export raw JSON via deep-frozen objects to ensure immutability.
- Keep filenames stable (`lower_snake_case`).
- Document breaking changes in `MIGRATION.md`.

## Migration (v1 → v2)
- JSON: `parameters` renamed to `entries`; new `schema_version`, `registry_id`, `dataset_id`, `entry_id`.
- API: Class-based static holders replaced by plain named exports; paths unchanged for JSON consumers importing files directly.
- Provide mapping guidance for common datasets (example code snippets).

## Implementation Steps
1) Draft v2 schema and types (importer + lib).
2) Implement normalization utilities (stable keys, sorting, slugging).
3) Implement semantic diff engine and change classifier.
4) Adapt importer to produce v2 JSON and write into lib.
5) Generate changelog content from diff.
6) Add CI workflow for build/lint/test.
7) Add scheduled update workflow creating PRs with summary.
8) Add release workflow to publish lib on tag.
9) Update docs: README, MIGRATION; bump to v2.

## Deliverables Checklist
- [ ] Types for v2 schema in `importer` and `lib`.
- [ ] Normalization + deterministic output utilities.
- [ ] Diff + changelog generator.
- [ ] Importer CLI `check-and-update` (exit 0/78 codes) and `generate`.
- [ ] CI workflow.
- [ ] Update workflow with PR automation.
- [ ] Release workflow.
- [ ] Library v2 API + typings.
- [ ] Migration + README updates.

