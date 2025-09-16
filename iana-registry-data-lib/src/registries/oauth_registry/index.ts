import { defineDataset } from '../../util/defineDataset';
import type { RegistryDatasetInput } from '../../util/defineDataset';
import type {
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
} from './types';

import oauth_access_token_types_json from './oauth_access_token_types.json';
import oauth_authorization_endpoint_response_types_json from './oauth_authorization_endpoint_response_types.json';
import oauth_authorization_server_metadata_json from './oauth_authorization_server_metadata.json';
import oauth_dynamic_client_registration_metadata_json from './oauth_dynamic_client_registration_metadata.json';
import oauth_extensions_error_registry_json from './oauth_extensions_error_registry.json';
import oauth_parameters_json from './oauth_parameters.json';
import oauth_token_endpoint_authentication_methods_json from './oauth_token_endpoint_authentication_methods.json';
import oauth_token_introspection_response_json from './oauth_token_introspection_response.json';
import oauth_token_type_hints_json from './oauth_token_type_hints.json';
import oauth_uri_json from './oauth_uri.json';
import pkce_code_challenge_methods_json from './pkce_code_challenge_methods.json';

export const oauth_access_token_types = defineDataset<OAuthAccessTokenTypeEntry>(
  oauth_access_token_types_json satisfies RegistryDatasetInput<OAuthAccessTokenTypeEntry>,
);
export const oauth_authorization_endpoint_response_types = defineDataset<
  OAuthAuthorizationEndpointResponseTypeEntry
>(
  oauth_authorization_endpoint_response_types_json satisfies RegistryDatasetInput<
    OAuthAuthorizationEndpointResponseTypeEntry
  >,
);
export const oauth_authorization_server_metadata = defineDataset<
  OAuthAuthorizationServerMetadataEntry
>(
  oauth_authorization_server_metadata_json satisfies RegistryDatasetInput<
    OAuthAuthorizationServerMetadataEntry
  >,
);
export const oauth_dynamic_client_registration_metadata = defineDataset<
  OAuthDynamicClientRegistrationMetadataEntry
>(
  oauth_dynamic_client_registration_metadata_json satisfies RegistryDatasetInput<
    OAuthDynamicClientRegistrationMetadataEntry
  >,
);
export const oauth_extensions_error_registry = defineDataset<
  OAuthExtensionsErrorRegistryEntry
>(
  oauth_extensions_error_registry_json satisfies RegistryDatasetInput<
    OAuthExtensionsErrorRegistryEntry
  >,
);
export const oauth_parameters = defineDataset<OAuthParameterEntry>(
  oauth_parameters_json satisfies RegistryDatasetInput<OAuthParameterEntry>,
);
export const oauth_token_endpoint_authentication_methods = defineDataset<
  OAuthTokenEndpointAuthenticationMethodEntry
>(
  oauth_token_endpoint_authentication_methods_json satisfies RegistryDatasetInput<
    OAuthTokenEndpointAuthenticationMethodEntry
  >,
);
export const oauth_token_introspection_response = defineDataset<
  OAuthTokenIntrospectionResponseEntry
>(
  oauth_token_introspection_response_json satisfies RegistryDatasetInput<
    OAuthTokenIntrospectionResponseEntry
  >,
);
export const oauth_token_type_hints = defineDataset<OAuthTokenTypeHintEntry>(
  oauth_token_type_hints_json satisfies RegistryDatasetInput<OAuthTokenTypeHintEntry>,
);
export const oauth_uri = defineDataset<OAuthUriEntry>(
  oauth_uri_json satisfies RegistryDatasetInput<OAuthUriEntry>,
);
export const pkce_code_challenge_methods = defineDataset<PkceCodeChallengeMethodEntry>(
  pkce_code_challenge_methods_json satisfies RegistryDatasetInput<PkceCodeChallengeMethodEntry>,
);

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
} from './types';
