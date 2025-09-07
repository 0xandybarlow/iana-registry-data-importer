import { promises as fs } from 'fs';
import * as path from 'path';
import { RegistryJson } from './interfaces/RegistryJson';

interface DiffResult {
  hasChanges: boolean;
  changes: {
    [filePath: string]: {
      type: 'added' | 'removed' | 'modified';
      details: string[];
      oldData?: RegistryJson;
      newData?: RegistryJson;
    };
  };
}

const compareParameters = (oldParams: any[], newParams: any[]): string[] => {
  const changes: string[] = [];

  // Check for added parameters
  newParams.forEach((newParam, index) => {
    const oldParam = oldParams[index];
    if (!oldParam) {
      changes.push(`Added parameter: ${JSON.stringify(newParam)}`);
      return;
    }

    // Compare each field
    Object.keys(newParam).forEach((key) => {
      if (JSON.stringify(newParam[key]) !== JSON.stringify(oldParam[key])) {
        changes.push(
          `Parameter ${index + 1} changed: ${key} from "${oldParam[key]}" to "${newParam[key]}"`,
        );
      }
    });
  });

  // Check for removed parameters
  if (oldParams.length > newParams.length) {
    for (let i = newParams.length; i < oldParams.length; i++) {
      changes.push(`Removed parameter: ${JSON.stringify(oldParams[i])}`);
    }
  }

  return changes;
};

export const checkForNewData = async (): Promise<DiffResult> => {
  const result: DiffResult = {
    hasChanges: false,
    changes: {},
  };

  const registriesDir = path.resolve(
    __dirname,
    '../../iana-registry-data-lib/src/registries',
  );
  const backupDir = path.resolve(
    __dirname,
    '../../iana-registry-data-lib/src/registries.bak',
  );

  try {
    // Create backup of current data
    await fs.cp(registriesDir, backupDir, { recursive: true });

    // Run the import process
    const { processDataSources } = require('./importAndProcessDatasources');
    await processDataSources();

    // Compare each file
    const files = await fs.readdir(registriesDir, { recursive: true });

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(registriesDir, file);
      const backupPath = path.join(backupDir, file);

      try {
        const newContent = await fs.readFile(filePath, 'utf-8');
        const newData: RegistryJson = JSON.parse(newContent);

        try {
          const oldContent = await fs.readFile(backupPath, 'utf-8');
          const oldData: RegistryJson = JSON.parse(oldContent);

          // Compare data (excluding timestamps)
          const oldCopy = JSON.parse(JSON.stringify(oldData));
          const newCopy = JSON.parse(JSON.stringify(newData));
          delete oldCopy.metadata.last_updated;
          delete oldCopy.metadata.last_processed;
          delete newCopy.metadata.last_updated;

          if (JSON.stringify(oldCopy) !== JSON.stringify(newCopy)) {
            const parameterChanges = compareParameters(
              oldData.parameters,
              newData.parameters,
            );
            if (parameterChanges.length > 0) {
              result.hasChanges = true;
              result.changes[file] = {
                type: 'modified',
                details: parameterChanges,
                oldData,
                newData,
              };
            }
          }
        } catch (err) {
          // File doesn't exist in backup - it's new
          result.hasChanges = true;
          result.changes[file] = {
            type: 'added',
            details: ['New registry file added'],
            newData: newData,
          };
        }
      } catch (err) {
        // File exists in backup but not in new - it was removed
        const oldContent = await fs.readFile(backupPath, 'utf-8');
        const oldData: RegistryJson = JSON.parse(oldContent);
        result.hasChanges = true;
        result.changes[file] = {
          type: 'removed',
          details: ['Registry file removed'],
          oldData,
        };
      }
    }

    // Clean up backup
    await fs.rm(backupDir, { recursive: true, force: true });

    return result;
  } catch (error) {
    // Clean up backup on error
    await fs.rm(backupDir, { recursive: true, force: true });
    throw error;
  }
};
