# iana-registry-data-lib

A package containing JSON files reflecting the current state of various IANA registries such as the JOSE, OAuth, and JWT registries. This package is intended to be used as a data source for other projects.

## Installation

You can install this package using npm:

```sh
npm install iana-registry-data-lib
```

```javascript
const { OAuthRegistry } = require('iana-registry-data-lib');
console.log(OAuthRegistry.OauthParameters.parameters);
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