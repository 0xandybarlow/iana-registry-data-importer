# iana-registry-data-lib

JSON datasets for IANA registries (OAuth, JOSE, JWT), plus TypeScript entrypoints.

## Installation

```sh
npm install iana-registry-data-lib
```

## Usage

```ts
import * as OAuth from 'iana-registry-data-lib';
import type { RegistryDataset } from 'iana-registry-data-lib';

const oauthParameters: RegistryDataset = OAuth.oauth_parameters;
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

The schema is stable and deterministic across releases.

## License
MIT

## Author
Andy Barlow
