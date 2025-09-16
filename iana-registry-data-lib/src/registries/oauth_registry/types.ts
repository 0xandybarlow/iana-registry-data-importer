import type { RegistryEntry } from '../../types';

export interface OAuthAccessTokenTypeEntry extends RegistryEntry {
  name: string;
  additional_token_endpoint_response_parameters: string;
  http_authentication_scheme: string;
  change_controller: string;
  reference: string;
}

export interface OAuthAuthorizationEndpointResponseTypeEntry extends RegistryEntry {
  name: string;
  change_controller: string;
  reference: string;
}

export interface OAuthAuthorizationServerMetadataEntry extends RegistryEntry {
  metadata_name: string;
  metadata_description: string;
  change_controller: string;
  reference: string;
}

export interface OAuthDynamicClientRegistrationMetadataEntry extends RegistryEntry {
  client_metadata_name: string;
  client_metadata_description: string;
  change_controller: string;
  reference: string;
}

export interface OAuthExtensionsErrorRegistryEntry extends RegistryEntry {
  name: string;
  usage_location: string;
  protocol_extension: string;
  change_controller: string;
  reference: string;
}

export interface OAuthParameterEntry extends RegistryEntry {
  name: string;
  parameter_usage_location: string;
  change_controller: string;
  reference: string;
}

export interface OAuthTokenEndpointAuthenticationMethodEntry extends RegistryEntry {
  token_endpoint_authentication_method_name: string;
  change_controller: string;
  reference: string;
}

export interface OAuthTokenIntrospectionResponseEntry extends RegistryEntry {
  name: string;
  description: string;
  change_controller: string;
  reference: string;
}

export interface OAuthTokenTypeHintEntry extends RegistryEntry {
  hint_value: string;
  change_controller: string;
  reference: string;
}

export interface OAuthUriEntry extends RegistryEntry {
  urn: string;
  common_name: string;
  change_controller: string;
  reference: string;
}

export interface PkceCodeChallengeMethodEntry extends RegistryEntry {
  code_challenge_method_parameter_name: string;
  change_controller: string;
  reference: string;
}
