# Migration Guide: v1 → v2

This guide helps you migrate from version 1.x to 2.x of `iana-registry-data-lib`.

## Summary of Breaking Changes

- JSON schema now has `schema_version: 2` and uses `entries` instead of `parameters`.
- Additional top-level fields: `registry_id`, `dataset_id`.
- Metadata now uses `last_updated_iso` (ISO 8601) instead of `last_updated`.
- Each entry includes a stable `entry_id` for deterministic tracking.
- The recommended API entrypoint is now `dist/index.v2.js` (TypeScript: `src/index.v2.ts`).

## JSON Shape Changes

v1:
```json
{
  "name": "OAuth Parameters",
  "metadata": { "required_specifications": ["RFC6749"], "datasource_url": "…", "last_updated": "…" },
  "parameters": [ { "parameter": "…", "reference": "…" } ]
}
```

v2:
```json
{
  "schema_version": 2,
  "registry_id": "oauth_registry",
  "dataset_id": "oauth_parameters",
  "name": "OAuth Parameters",
  "metadata": { "required_specifications": ["RFC6749"], "datasource_url": "…", "last_updated_iso": "…" },
  "entries": [ { "entry_id": "oauth_parameters_param", "parameter": "…", "reference": "…" } ]
}
```

Key mappings:
- `parameters` → `entries`
- `last_updated` → `last_updated_iso`

## Importing Data

TypeScript/ESM (v2 default):
```ts
import * as OAuth from 'iana-registry-data-lib';
import type { V2RegistryDataset } from 'iana-registry-data-lib/dist/types.v2';

const dataset: V2RegistryDataset = OAuth.oauth_parameters; // named exports per dataset
```

CommonJS:
```js
const OAuth = require('iana-registry-data-lib');
const dataset = OAuth.oauth_parameters;
```

Direct JSON import:
```ts
import oauth_parameters from 'iana-registry-data-lib/dist/registries/oauth_registry/oauth_parameters.json';
```

## Migration Steps

1. Bump dependency:
```json
{
  "dependencies": { "iana-registry-data-lib": "^2.0.0" }
}
```
2. Replace usages of `parameters` with `entries`.
3. Replace `metadata.last_updated` with `metadata.last_updated_iso`.
4. If you relied on class-based wrappers (`OAuthRegistry.*`), switch to named exports from `index.v2` or import JSON directly.

## Notes

- Entries and objects are normalized and sorted deterministically; key order is stable.
- `entry_id` is derived from primary key fields to support consistent diffing.

## Support

Open an issue in the GitHub repository if you hit migration problems.
