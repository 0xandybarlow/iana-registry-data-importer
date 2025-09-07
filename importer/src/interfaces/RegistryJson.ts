export interface RegistryJson {
  name: string;
  metadata: {
    required_specifications: string[];
    datasource_url: string;
    last_updated: string;
  };
  parameters: unknown[];
}
