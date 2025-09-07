# registry-importer

This project imports and processes data from various IANA registries such as the JOSE, OAuth, and JWT registries. It is intended to be used as a standalone script and is not available as a package on npm.

## v2 Pipeline (Breaking)

- Schema: Generates v2 datasets with `schema_version: 2`, `entries`, stable `entry_id`.
- Semantic diff: Compares normalized data; ignores ordering and timestamps.
- Format upgrade: Rewrites v1 JSON to v2 even if content unchanged.
- Filtered runs:
  - CLI: `npm run import-data:v2 -- --filter=oauth_registry/oauth_parameters`
  - ENV: `DATASET_FILTER=oauth_parameters npm run import-data:v2`
- Debug logging: `DEBUG_V2=1 npm run import-data:v2 -- --filter=jwt_registry/json_web_token_claims`

### Primary Keys

- Purpose: identify entries consistently across runs for reliable diffs.
- Source: derived from dataset-specific fields (e.g., `parameter`, `claim_name`, `uri`).
- Config: see `importer/src/v2/sources.ts` under `primary_keys` overrides.
- Behavior: `entry_id` is the raw/cleaned primary key value(s); if multiple, joined with `|`.

### Change Detection

- Ignores: field order, array order, and timestamps.
- Detects: entry additions/removals and per-field changes.
- Changelog: `CHANGELOG_UPDATE.md` is generated with a concise summary for PRs.

### Outputs

- Writes v2 JSON to: `iana-registry-data-lib/src/registries/<registry_id>/<dataset_id>.json`.
- On v1 files, performs a format-only upgrade to v2 when content matches.

## Workflows

- CI (`.github/workflows/ci.yml`):

  - Triggers: push/PR to `master`.
  - Runs Node 20, installs deps, builds importer + library, lints, and runs importer tests.

- Update IANA Data (`.github/workflows/update-data.yml`):

  - Triggers: weekly (Mon 05:00 UTC) and manual dispatch.
  - Input: `dataset_filter` to limit scope (e.g., `jwt_registry/json_web_token_claims`).
  - Behavior: fetch → normalize (v2) → semantic diff → write JSON and open PR with `CHANGELOG_UPDATE.md` if content changed or if a format-only v1→v2 upgrade is needed. Does not publish to npm.

- Release Library (`.github/workflows/release.yml`):
  - Triggers: tag push `iana-registry-data-lib@*` (e.g., `iana-registry-data-lib@2.0.0`).
  - Publishes `iana-registry-data-lib` using `NPM_AUTOMATION_TOKEN`.
  - Importer is not published; its version tracks pipeline changes only.

### Local Workflow Commands

- Build importer: `npm run build:importer`
- Filtered import: `npm run import-data:v2 -- --filter=<substring>` or `DATASET_FILTER=<substring> npm run import-data:v2`
- Debug logs: `DEBUG_V2=1 npm run import-data:v2 -- --filter=...`

## Installation

To install the dependencies, run:

```sh
npm install
```

## Usage

```sh
npm run build:importer
```

```sh
npm run generate-data
```

v2 entrypoint (writes v2 JSON into the library workspace):

```sh
npm run import-data:v2
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Keywords

- Keywords
- iana
- registry
- oauth
- jose
- jwt
- rfc
- ietf
- importer
- data
- parser
- json
- csv

## Author

Andy Barlow
