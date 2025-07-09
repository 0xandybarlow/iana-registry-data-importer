# Migration Guide: v1 to v2

This guide helps you migrate from version 1.x to version 2.0.0 of `iana-registry-data-lib`.

## Breaking Changes

### Field Name Change

The `last_processed` field in registry metadata has been renamed to `last_updated`:

```diff
{
  "name": "OAuth Parameters",
  "metadata": {
    "required_specifications": ["RFC6749"],
    "datasource_url": "https://www.iana.org/assignments/oauth-parameters/oauth-parameters-1.csv",
-   "last_processed": "2024-01-01T00:00:00.000Z"
+   "last_updated": "2024-01-01T00:00:00.000Z"
  },
  "parameters": [...]
}
```

### Timestamp Behavior Change

The timestamp field now only updates when actual data changes occur:
- In v1: The timestamp was updated every time the data was processed
- In v2: The timestamp only updates when the registry data actually changes

## Migration Steps

1. Update your package.json:
```json
{
  "dependencies": {
    "iana-registry-data-lib": "^2.0.0"
  }
}
```

2. Update any code that references the `last_processed` field:
```typescript
// Before
const lastProcessed = registry.metadata.last_processed;

// After
const lastUpdated = registry.metadata.last_updated;
```

3. Update any documentation or tests that reference the old field name

## Benefits of Upgrading

- More accurate timestamps that reflect actual data changes
- Better change detection and logging
- Improved data consistency
- Enhanced GitHub Actions workflow for automated updates

## Support

If you encounter any issues during migration, please open an issue in the GitHub repository. 