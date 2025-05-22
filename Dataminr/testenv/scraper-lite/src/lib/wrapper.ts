import path from 'path';
import { readdir } from 'fs/promises';
import LiteParser from './parsers/liteParser';

export type parserImport = { parser: LiteParser };

/* dynamically load all parsers from /sources */
export async function getSources(): Promise<parserImport[]> {
  const dirPath = path.resolve(__dirname, '../sources');
  const files = (await readdir(dirPath)).filter((f) => f.search(/\.js$/) !== -1);
  return Promise.all(files.map((f) => import(`${dirPath}/${f}`)));
}
