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

const compareData = (existingData: any, newData: any): boolean => {
  // Create copies without the last_updated field for comparison
  const existingCopy = existingData ? { ...existingData } : {};
  const newCopy = { ...newData };
  
  if (existingCopy.metadata) delete existingCopy.metadata.last_updated;
  if (newCopy.metadata) delete newCopy.metadata.last_updated;
  
  return JSON.stringify(existingCopy) !== JSON.stringify(newCopy);
};

const processDataSources = async () => {
  for (const registry of IANA_REGISTRIES_TO_PUBLISH) {
    for (const datasource of registry.source as RegistryMetadata[]) {
      try {
        const getDataFromUrl = await getData(datasource.url);
        const data = await csvToObject(getDataFromUrl);

        const dataDir = path.resolve(
          __dirname,
          `../../iana-registry-data-lib/src/registries/${preparePathFriendlyName(registry.name)}`,
        );

        const filePath = path.resolve(
          dataDir,
          `${preparePathFriendlyName(datasource.name)}`,
        );

        // Create new registry JSON without timestamp
        const registryJson = {
          name: datasource.name,
          metadata: {
            required_specifications: datasource.required_specifications,
            datasource_url: datasource.url,
            last_updated: null, // Will be set only if there are changes
          },
          parameters: data,
        };

        // Check if file exists and compare
        let existingData = null;
        try {
          const existingContent = await fs.readFile(`${filePath}.json`, 'utf-8');
          existingData = JSON.parse(existingContent);
        } catch (err) {
          // File doesn't exist or can't be read, treat as new data
        }

        const hasChanges = compareData(existingData, registryJson);
        
        if (hasChanges || !existingData) {
          // Only set last_updated if there are changes
          registryJson.metadata.last_updated = new Date().toISOString();
        } else {
          // Keep the existing last_updated timestamp
          registryJson.metadata.last_updated = existingData.metadata.last_updated;
        }

        await createDatasourceDirectories(dataDir);
        await writeJSON(filePath, registryJson, 2);

        if (hasChanges) {
          console.log(`Changes detected and files written successfully: ${filePath}`);
        } else {
          console.log(`No changes detected for: ${filePath}`);
        }
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
    console.log('Processing registries completed successfully');
  })
  .catch((error) => {
    console.error(`Processing datasources failed: ${error.message}`);
  });
