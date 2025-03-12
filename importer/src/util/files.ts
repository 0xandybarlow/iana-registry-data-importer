import { promises as fs } from 'fs';
import path from 'path';

export const writeJSON = async (filePath: string, jsonData: object, space = 0) => {
  return fs.writeFile(`${filePath}.json`, JSON.stringify(jsonData, null, space));
};

export const preparePathFriendlyName = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_');

export const filePath = (dataDirectory: string, datasourceName: string) =>
  path.resolve(dataDirectory, `${preparePathFriendlyName(datasourceName)}`);
