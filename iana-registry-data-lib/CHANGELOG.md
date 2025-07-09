# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-07-09

### Breaking Changes
- Changed `last_processed` field to `last_updated` in registry metadata
  - This field now only updates when actual data changes occur
  - The timestamp reflects when the data was last modified, not just when it was processed

### Added
- Improved change detection in registry data
- Detailed logging of parameter changes
- Better handling of data migrations

### Changed
- Enhanced GitHub Actions workflow to only create PRs when actual changes are detected
- Improved error handling and logging

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Support for OAuth, JOSE, and JWT registry data
- Basic data import and processing 