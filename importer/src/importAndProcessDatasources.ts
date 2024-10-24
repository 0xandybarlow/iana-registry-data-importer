import { RegistryMetadata } from './interfaces/RegistryMetadata';
import { csvToObject } from './convertCsvToObject';
import { getData } from './util/network';
import { preparePathFriendlyName, writeJSON } from './util/files';
import { promises as fs } from 'fs';
import * as path from 'path';

import { oauthRegistryDatasources } from './sources/oauth-registry-datasources';
import { joseRegistryDatasources } from './sources/jose-registry-datasources';
import { jwtRegistryDatasources } from './sources/jwt-registry-datasources';

const IANA_REGISTRIES_TO_PUBLISH = [
  { name: 'OAuth Registry', source: oauthRegistryDatasources },
  { name: 'JOSE Registry', source: joseRegistryDatasources },
  { name: 'JWT Registry', source: jwtRegistryDatasources },
];

const createDatasourceDirectories = async (
  datasourceName: string,
): Promise<string> => {
  const dataDir = datasourceName;

  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`Directories created or already exist: ${dataDir}`);
    return dataDir;
  } catch (error) {
    throw new Error(
      `Error creating directories: ${dataDir}, message: ${(error as Error).message}`,
    );
  }
};
const processDataSources = async () => {
  const processDate = new Date().toISOString();
  for (const registry of IANA_REGISTRIES_TO_PUBLISH) {
    for (const datasource of registry.source as RegistryMetadata[]) {
      try {
        const getDataFromUrl = await getData(datasource.url);
        const data = await csvToObject(getDataFromUrl);

        const registryJson = {
          name: datasource.name,
          metadata: {
            required_specifications: datasource.required_specifications,
            datasource_url: datasource.url,
            last_processed: processDate,
          },
          parameters: data,
        };

        const dataDir = path.resolve(
          __dirname,
          `../../iana-registry-data-lib/src/registries/${preparePathFriendlyName(registry.name)}`,
        );

        const filePath = path.resolve(
          dataDir,
          `${preparePathFriendlyName(datasource.name)}`,
        );
        await createDatasourceDirectories(dataDir);
        await writeJSON(filePath, registryJson);

        console.log(`Files written successfully: ${filePath}`);
      } catch (error) {
        console.error(
          `Error whilst processing: ${datasource.url}, message: ${(error as Error).message}`,
        );
      }
    }
  }
};

processDataSources()
  .then(() => {
    console.log('Processing oauthRegistryDatasources completed successfully');
  })
  .catch((error) => {
    console.error(`Processing datasources failed: ${error.message}`);
  });
