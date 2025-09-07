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

export const REGISTRIES_V2: { name: string; sources: V2DatasourceConfig[] }[] = [
  { name: 'OAuth Registry', sources: mapDatasets('oauth_registry', oauthRegistryDatasources) },
  { name: 'JOSE Registry', sources: mapDatasets('jose_registry', joseRegistryDatasources) },
  { name: 'JWT Registry', sources: mapDatasets('jwt_registry', jwtRegistryDatasources) },
];

