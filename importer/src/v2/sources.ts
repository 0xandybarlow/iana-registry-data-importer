import { oauthRegistryDatasources } from '../sources/oauth-registry-datasources';
import { joseRegistryDatasources } from '../sources/jose-registry-datasources';
import { jwtRegistryDatasources } from '../sources/jwt-registry-datasources';
import { preparePathFriendlyName } from '../util/files';
import { RegistryMetadata } from '../interfaces/RegistryMetadata';

export interface V2DatasourceConfig extends RegistryMetadata {
  registry_id: string;
  dataset_id: string;
  // optional explicit primary key fields; fallback is heuristic
  primary_keys?: string[];
}

const mapDatasets = (
  registryName: string,
  sources: RegistryMetadata[],
): V2DatasourceConfig[] => {
  const registry_id = `${preparePathFriendlyName(registryName)}`;
  return sources.map((s) => ({
    ...s,
    registry_id,
    dataset_id: preparePathFriendlyName(s.name),
  }));
};

const applyPrimaryKeys = (
  _registryId: string,
  configs: V2DatasourceConfig[],
): V2DatasourceConfig[] => {
  const overrides: Record<string, string[]> = {
    // OAuth
    oauth_access_token_types: ['name'],
    oauth_authorization_endpoint_response_types: ['name'],
    oauth_extensions_error_registry: ['name'],
    oauth_parameters: ['name'],
    oauth_token_type_hints: ['hint_value'],
    oauth_uri: ['urn'],
    oauth_dynamic_client_registration_metadata: ['client_metadata_name'],
    oauth_token_endpoint_authentication_methods: [
      'token_endpoint_authentication_method_name',
    ],
    pkce_code_challenge_methods: ['code_challenge_method_parameter_name'],
    oauth_token_introspection_response: ['name'],
    oauth_authorization_server_metadata: ['metadata_name'],

    // JOSE
    json_web_encryption_compression_algorithms: ['compression_algorithm_value'],
    json_web_key_types: ['kty_parameter_value'],
    json_web_key_elliptic_curve: ['curve_name'],
    json_web_key_parameters: ['parameter_name'],
    json_web_key_use: ['use_member_value'],
    json_web_key_operations: ['key_operation_value'],
    json_web_key_set_parameters: ['parameter_name'],

    // JWT
    json_web_token_claims: ['claim_name'],
    jwt_confirmation_methods: ['confirmation_method_value'],
  };

  return configs.map((c) => ({
    ...c,
    primary_keys: overrides[c.dataset_id] ?? c.primary_keys,
  }));
};

export const REGISTRIES_V2: { name: string; sources: V2DatasourceConfig[] }[] =
  [
    {
      name: 'OAuth Registry',
      sources: applyPrimaryKeys(
        'oauth_registry',
        mapDatasets('oauth_registry', oauthRegistryDatasources),
      ),
    },
    {
      name: 'JOSE Registry',
      sources: applyPrimaryKeys(
        'jose_registry',
        mapDatasets('jose_registry', joseRegistryDatasources),
      ),
    },
    {
      name: 'JWT Registry',
      sources: applyPrimaryKeys(
        'jwt_registry',
        mapDatasets('jwt_registry', jwtRegistryDatasources),
      ),
    },
  ];
