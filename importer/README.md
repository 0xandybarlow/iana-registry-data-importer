# registry-importer

This project imports and processes data from various IANA registries such as the JOSE, OAuth, and JWT registries. It is intended to be used as a standalone script and is not available as a package on npm.

## Data Pipeline (Breaking in 2.0)

- Schema: Generates datasets with `schema_version: 2`, `entries`, stable `entry_id`.
- Semantic diff: Compares normalized data; ignores ordering and timestamps.
- Format upgrade: Ensures legacy JSON is rewritten to the schema_version 2 shape even if content is unchanged.
- Filtered runs:
  - CLI: `npm run import-data -- --filter=oauth_registry/oauth_parameters`
  - ENV: `DATASET_FILTER=oauth_parameters npm run import-data`
- Debug logging: `DEBUG_IMPORTER=1 npm run import-data -- --filter=jwt_registry/json_web_token_claims`

### Primary Keys

- Purpose: identify entries consistently across runs for reliable diffs.
- Source: derived from dataset-specific fields (e.g., `parameter`, `claim_name`, `uri`).
- Config: see `importer/src/pipeline/sources.ts` under `primary_keys` overrides.
- Behavior: `entry_id` is the raw/cleaned primary key value(s); if multiple, joined with `|`.

### Change Detection

- Ignores: field order, array order, and timestamps.
- Detects: entry additions/removals and per-field changes.
- Changelog: `CHANGELOG_UPDATE.md` is generated with a concise summary for PRs.

### Outputs

- Writes JSON to: `iana-registry-data-lib/src/registries/<registry_id>/<dataset_id>.json`.
- Performs schema-only upgrades when existing files already match the latest content.

## Workflows

- CI (`.github/workflows/ci.yml`):

  - Triggers: push/PR to `master`.
  - Runs Node 20, installs deps, builds importer + library, lints, and runs importer tests.

- Update IANA Data (`.github/workflows/update-data.yml`):

  - Triggers: weekly (Mon 05:00 UTC) and manual dispatch.
  - Input: `dataset_filter` to limit scope (e.g., `jwt_registry/json_web_token_claims`).
  - Behavior: fetch → normalize → semantic diff → write JSON and open PR with `CHANGELOG_UPDATE.md` if content changed or if a schema-only update is needed. Does not publish to npm.

- Release Library (`.github/workflows/release.yml`):
  - Triggers: tag push `iana-registry-data-lib@*` (e.g., `iana-registry-data-lib@2.0.0`).
  - Publishes `iana-registry-data-lib` using `NPM_AUTOMATION_TOKEN`.
  - Importer is not published; its version tracks pipeline changes only.

### Local Workflow Commands

- Build importer: `npm run build:importer`
- Filtered import: `npm run import-data -- --filter=<substring>` or `DATASET_FILTER=<substring> npm run import-data`
- Debug logs: `DEBUG_IMPORTER=1 npm run import-data -- --filter=...`

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

Entrypoint (writes JSON into the library workspace):

```sh
npm run import-data
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
