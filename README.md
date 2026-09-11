# iana-registry-data-importer

This repository contains two main projects:

1. **iana-registry-data-lib**: A Node.js package containing JSON files reflecting the current state of various IANA registries such as the JOSE, OAuth, and JWT registries. This package is intended to be used as a data source for other projects. See the [README](iana-registry-data-lib/README.md) for more details.
2. **registry-importer**: A standalone script written in typescript that imports and processes data from various IANA registries. See the [README](importer/README.md) for more details.

## Automated data releases

One weekly `Update IANA Data` workflow performs a complete IANA sweep and, when
data changes, prepares one `chore/update-iana-data` pull request with the next
patch version, root lockfile, and durable library changelog entry. The pull
request is maintained by a repository-scoped GitHub App, using
`IANA_RELEASE_APP_CLIENT_ID` (repository variable) and
`IANA_RELEASE_APP_PRIVATE_KEY` (repository secret), so its CI starts normally.

Manual runs with `dataset_filter` are diagnostic only: they upload a summary and
never create a release PR or mint App credentials. Protect `master` with the
single `CI / validate` check. GitHub App installation, branch protection, npm
trusted-publisher configuration, and the first live release remain maintainer
operations.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Keywords
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
