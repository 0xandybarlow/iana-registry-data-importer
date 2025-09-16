# iana-registry-data-lib

JSON datasets for IANA registries (OAuth, JOSE, JWT), plus TypeScript entrypoints.

## Installation

```sh
npm install iana-registry-data-lib
```

## Usage

```ts
import { JOSE, OAuth } from 'iana-registry-data-lib';
import type {
  OAuthParameterEntry,
  RegistryDataset,
} from 'iana-registry-data-lib';

const oauthParameters: RegistryDataset<OAuthParameterEntry> = OAuth.oauth_parameters;
const firstParameter: OAuthParameterEntry | undefined = oauthParameters.entries[0];
const joseKeyTypes = JOSE.json_web_key_types;

console.log({
  oauthDatasets: Object.keys(OAuth),
  firstParameter: firstParameter?.parameter,
});
```

The bundled JSON assets each export strongly typed `RegistryDataset` objects, so
TypeScript projects get autocompletion across metadata fields and the individual
registry entries.

### Exports

- `OAuth`, `JOSE`, and `JWT` namespace objects with one property per dataset.
- `RegistryDataset`, `RegistryEntry`, and `RegistryMetadata` utility types.
- Concrete entry interfaces for every dataset (for example
  `OAuthParameterEntry`, `JsonWebKeyTypeEntry`, `JsonWebTokenClaimEntry`).

Every dataset under `dist/registries/<registry>/<dataset>.json` conforms to:

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

## License
MIT

## Author
Andy Barlow

## URL
[oauth2.dev](https://www.oauth2.dev)
