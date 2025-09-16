export type { RegistryDataset, RegistryEntry, RegistryMetadata } from './types';
export type { RegistryDatasetInput } from './util/defineDataset';
export type {
  OAuthAccessTokenTypeEntry,
  OAuthAuthorizationEndpointResponseTypeEntry,
  OAuthAuthorizationServerMetadataEntry,
  OAuthDynamicClientRegistrationMetadataEntry,
  OAuthExtensionsErrorRegistryEntry,
  OAuthParameterEntry,
  OAuthTokenEndpointAuthenticationMethodEntry,
  OAuthTokenIntrospectionResponseEntry,
  OAuthTokenTypeHintEntry,
  OAuthUriEntry,
  PkceCodeChallengeMethodEntry,
} from './registries/oauth_registry/types';
export type {
  JsonWebEncryptionCompressionAlgorithmEntry,
  JsonWebKeyEllipticCurveEntry,
  JsonWebKeyOperationEntry,
  JsonWebKeyParameterEntry,
  JsonWebKeySetParameterEntry,
  JsonWebKeyTypeEntry,
  JsonWebKeyUseEntry,
} from './registries/jose_registry/types';
export type {
  JsonWebTokenClaimEntry,
  JwtConfirmationMethodEntry,
} from './registries/jwt_registry/types';

export * as OAuth from './registries/oauth_registry/index';
export * as JOSE from './registries/jose_registry/index';
export * as JWT from './registries/jwt_registry/index';
