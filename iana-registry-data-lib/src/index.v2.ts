// v2 entry point (to be made default in major release)
export type { V2RegistryDataset, V2RegistryEntry, V2RegistryMetadata } from './types.v2';

export * as OAuth from './registries/oauth_registry/index.v2';
export * as JOSE from './registries/jose_registry/index.v2';
export * as JWT from './registries/jwt_registry/index.v2';
