# Changelog (registry-importer)

All notable changes to the importer workspace will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [2.0.0] - 2025-09-07

### Breaking Changes

- Updated data pipeline and schema generation:
  - Outputs JSON with `schema_version: 2`, `entries` (formerly `parameters`), `registry_id`, and `dataset_id`.
  - Each entry includes a stable `entry_id` derived from raw/cleaned primary key fields (no hashing).
- Library integration changes: data is written in the current schema under `iana-registry-data-lib/src/registries/**`.

### Added

- Deterministic normalization and ordering (snake_case keys, whitespace cleanup, stable output).
- Semantic diff engine that ignores ordering and timestamps; classifies adds/removes/field changes.
- Format upgrade: rewrites existing JSON files to the current schema even when content is identical.
- Dataset filtering:
  - CLI: `npm run import-data -- --filter=<substring>`
  - ENV: `DATASET_FILTER=<substring>`
- Debug logging gated by `DEBUG_IMPORTER=1`.
- Unit tests for normalization and diff behavior.

### Changed

- CI workflows use Node 20 and build both importer and library workspaces.
- Update workflow opens a PR with a concise changelog body derived from semantic diffs.

### Notes

- Primary keys per dataset are explicitly configured for stable diffs; see `importer/src/pipeline/sources.ts`.
- The importer is not published to npm; version bump aligns with the pipeline overhaul.

## [1.0.0] - 2024-01-01

- Initial workspace setup and v1 data import pipeline.
