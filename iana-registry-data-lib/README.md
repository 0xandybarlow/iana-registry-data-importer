# iana-registry-data-lib

JSON datasets for IANA registries (OAuth, JOSE, JWT), plus TypeScript entrypoints.

Version 2 introduces a stable, deterministic schema and a new entrypoint.

## Installation

```sh
npm install iana-registry-data-lib
```

## Usage (v2)

```ts
import * as OAuth from 'iana-registry-data-lib/dist/index.v2';
import type { V2RegistryDataset } from 'iana-registry-data-lib/dist/types.v2';

const oauthParameters: V2RegistryDataset = OAuth.oauth_parameters;
console.log(oauthParameters.entries.length);
```

Each dataset under `dist/registries/<registry>/<dataset>.json` conforms to:

```json
{
  "schema_version": 2,
  "registry_id": "oauth_registry",
  "dataset_id": "oauth_parameters",
  "name": "OAuth Parameters",
  "metadata": { "datasource_url": "…", "required_specifications": [], "last_updated_iso": "…" },
  "entries": [ { "entry_id": "…", "parameter": "…" } ]
}
```

See `MIGRATION.md` for v1 → v2 changes.

## License
MIT

## Author
Andy Barlow
