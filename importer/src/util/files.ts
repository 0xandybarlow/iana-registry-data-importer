import { promises as fs } from 'fs';
import path from 'path';

export const writeJSON = async (filePath: string, jsonData: object) => {
  return fs.writeFile(`${filePath}.json`, JSON.stringify(jsonData, null, 0));
};

export const preparePathFriendlyName = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_');

export const filePath = (dataDirectory: string, datasourceName: string) =>
  path.resolve(dataDirectory, `${preparePathFriendlyName(datasourceName)}`);
