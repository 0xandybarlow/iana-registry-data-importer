# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-09-16

### Breaking Changes
- Typed dataset exports: `OAuth`, `JOSE`, and `JWT` modules now return `RegistryDataset<TEntry>` objects with concrete entry interfaces. TypeScript callers relying on implicit `any` access or mutating entry records will need to align with the stricter generics.
- Runtime type stubs removed: build output no longer ships `dist/**/types.js`; import the package entrypoints or the generated `.d.ts` definitions instead.

### Added
- Registry-specific entry interfaces are exported alongside dataset utilities, delivering IDE autocomplete and compile-time safety for OAuth, JOSE, and JWT registries.
- New `defineDataset` helper validates registry snapshots at load time and wires the correct generics for downstream consumers.
- `scripts/finalize-dist.js` now minifies JSON payloads and strips redundant JS stubs during publish to keep installs slim.

### Data
- Refreshed all registries with IANA snapshots published on 2025-09-07 (`metadata.last_updated_iso`).

## [2.0.0] - 2025-09-07

### Breaking Changes
- New JSON schema:
  - Adds `schema_version: 2`, `registry_id`, and `dataset_id`.
  - Renames `parameters` → `entries`.
  - Metadata timestamp renamed to `last_updated_iso` (ISO 8601).
- Stable entry identifiers:
  - Every entry has `entry_id` derived from raw/cleaned primary key fields.
- Library API:
  - Default entrypoint is now the package root `iana-registry-data-lib` (Main: `dist/index.js`).
  - Class wrappers replaced by plain named exports under namespace (e.g., `import * as OAuth from 'iana-registry-data-lib'`).
  - Direct JSON imports should use `dist/registries/.../*.json`.

### Added
- Deterministic normalization (key casing, whitespace cleanup) and output ordering.
- Semantic diffing that ignores ordering/timestamps; classifies adds/removes/field changes.
- Automated weekly update workflow that opens PRs with a concise changelog.
- Format upgrade: previous files are upgraded to the new schema even when content is identical.

### Changed
- CI and workflows aligned to Node 20; monorepo build for importer and library.
- Release flow publishes on tags matching `iana-registry-data-lib@*` using `NPM_AUTOMATION_TOKEN`.

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Support for OAuth, JOSE, and JWT registry data
- Basic data import and processing 
