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
- Release detail: complete sweeps can write an explicit summary and PR body path;
  these ephemeral files are never committed.

### Outputs

- Writes JSON to: `iana-registry-data-lib/src/registries/<registry_id>/<dataset_id>.json`.
- Performs schema-only upgrades when existing files already match the latest content.

## Workflows

- CI (`.github/workflows/ci.yml`):

  - Triggers: push/PR to `master` and exposes the stable `validate` job.
  - Uses Node 24 and root `npm ci`; validates importer, committed data, an
    automated release PR's allowed paths/version, and the packed library.

- Update IANA Data (`.github/workflows/update-data.yml`):

  - Triggers: weekly (Mon 05:00 UTC) and manual dispatch.
  - Input: `dataset_filter` to limit scope (e.g., `jwt_registry/json_web_token_claims`).
  - Behavior: a complete run fetches → normalizes → validates → writes a
    candidate release PR through a repository-scoped GitHub App. A filtered
    dispatch is diagnostic-only and writes no registry data or PR.

- Release Library (`.github/workflows/release.yml`):
  - The merge-gated OIDC publication transaction is being completed on the
    feature branch; the importer is never published.

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
