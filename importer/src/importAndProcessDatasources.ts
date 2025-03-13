import { RegistryMetadata } from './interfaces/RegistryMetadata';
import { csvToObject } from './convertCsvToObject';
import { getData } from './util/network';
import { preparePathFriendlyName, writeJSON } from './util/files';
import { promises as fs } from 'fs';
import * as path from 'path';

import { oauthRegistryDatasources } from './sources/oauth-registry-datasources';
import { joseRegistryDatasources } from './sources/jose-registry-datasources';
import { jwtRegistryDatasources } from './sources/jwt-registry-datasources';

interface RegistryJson {
  name: string;
  metadata: {
    required_specifications: string[];
    datasource_url: string;
    last_updated: string;
    last_processed?: string;
  };
  parameters: any[];
}

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

const getParameterChanges = (existingData: RegistryJson, newData: RegistryJson): string[] => {
  const changes: string[] = [];
  
  // Compare each parameter
  newData.parameters.forEach((newParam: any, index: number) => {
    const existingParam = existingData.parameters[index];
    if (!existingParam) {
      changes.push(`Added new parameter: ${JSON.stringify(newParam)}`);
      return;
    }

    // Compare each field in the parameter
    Object.keys(newParam).forEach(key => {
      if (JSON.stringify(newParam[key]) !== JSON.stringify(existingParam[key])) {
        changes.push(`Parameter ${index + 1} changed: ${key} from "${existingParam[key]}" to "${newParam[key]}"`);
      }
    });
  });

  // Check for removed parameters
  if (existingData.parameters.length > newData.parameters.length) {
    for (let i = newData.parameters.length; i < existingData.parameters.length; i++) {
      changes.push(`Removed parameter: ${JSON.stringify(existingData.parameters[i])}`);
    }
  }

  return changes;
};

const compareData = (existingData: RegistryJson | null, newData: RegistryJson): { hasChanges: boolean; changes: string[] } => {
  if (!existingData) return { hasChanges: true, changes: ['Initial import'] };
  
  // Create deep copies of the objects
  const existingCopy = JSON.parse(JSON.stringify(existingData));
  const newCopy = JSON.parse(JSON.stringify(newData));
  
  // Remove timestamp fields for comparison
  delete existingCopy.metadata.last_updated;
  delete existingCopy.metadata.last_processed;
  delete newCopy.metadata.last_updated;
  
  const hasChanges = JSON.stringify(existingCopy) !== JSON.stringify(newCopy);
  const changes = hasChanges ? getParameterChanges(existingData, newData) : [];
  
  return { hasChanges, changes };
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

        // Create new registry JSON with initial timestamp
        const registryJson: RegistryJson = {
          name: datasource.name,
          metadata: {
            required_specifications: datasource.required_specifications,
            datasource_url: datasource.url,
            last_updated: new Date().toISOString(),
          },
          parameters: data,
        };

        // Check if file exists and compare
        let existingData: RegistryJson | null = null;
        try {
          const existingContent = await fs.readFile(`${filePath}.json`, 'utf-8');
          existingData = JSON.parse(existingContent);
        } catch (err) {
          // File doesn't exist or can't be read, treat as new data
        }

        const { hasChanges, changes } = compareData(existingData, registryJson);
        
        if (!hasChanges && existingData) {
          // Handle migration from last_processed to last_updated
          if ('last_processed' in existingData.metadata) {
            console.log(`Migrating ${filePath} from last_processed to last_updated`);
            registryJson.metadata.last_updated = existingData.metadata.last_processed!;
          } else {
            registryJson.metadata.last_updated = existingData.metadata.last_updated;
          }
        }

        await createDatasourceDirectories(dataDir);
        await writeJSON(filePath, registryJson, 2);

        if (hasChanges) {
          console.log(`Changes detected in ${filePath}:`);
          changes.forEach(change => console.log(`  - ${change}`));
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
