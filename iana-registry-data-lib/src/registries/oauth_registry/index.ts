import OauthAccessTokenTypes from "./oauth_access_token_types.json";
import OauthAuthorizationEndpointResponseTypes from "./oauth_authorization_endpoint_response_types.json";
import OauthAuthorizationServerMetadata from "./oauth_authorization_server_metadata.json";
import OauthDynamicClientRegistrationMetadata from "./oauth_dynamic_client_registration_metadata.json";
import OauthExtensionsErrorRegistry from "./oauth_extensions_error_registry.json";
import OauthParameters from "./oauth_parameters.json";
import OauthTokenEndpointAuthenticationMethods from "./oauth_token_endpoint_authentication_methods.json";
import OauthTokenIntrospectionResponse from "./oauth_token_introspection_response.json";
import OauthTokenTypeHints from "./oauth_token_type_hints.json";
import OauthUri from "./oauth_uri.json";
import PkceCodeChallengeMethods from "./pkce_code_challenge_methods.json";

/**
 * OAuth Registry
 * Wrapper class for OAuth Registry registries-lib which can be called to access the underlying JSON registry registries-lib
 */

export class OAuthRegistry {
  public static OauthAccessTokenTypes = OauthAccessTokenTypes;
  public static OauthAuthorizationEndpointResponseTypes =
    OauthAuthorizationEndpointResponseTypes;
  public static OauthAuthorizationServerMetadata =
    OauthAuthorizationServerMetadata;
  public static OauthDynamicClientRegistrationMetadata =
    OauthDynamicClientRegistrationMetadata;
  public static OauthExtensionsErrorRegistry = OauthExtensionsErrorRegistry;
  public static OauthParameters = OauthParameters;
  public static OauthTokenEndpointAuthenticationMethods =
    OauthTokenEndpointAuthenticationMethods;
  public static OauthTokenIntrospectionResponse =
    OauthTokenIntrospectionResponse;
  public static OauthTokenTypeHints = OauthTokenTypeHints;
  public static OauthUri = OauthUri;
  public static PkceCodeChallengeMethods = PkceCodeChallengeMethods;
}
