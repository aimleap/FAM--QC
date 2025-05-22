import path from 'path';
import { glob } from 'glob';
import { Application } from '../constants/application';
import { SourceType } from '../lib/parserUtil';
import AuthParser from '../spiders/parsers/AuthParser';
import HeuristicForumParser from '../spiders/parsers/HeuristicForumParser';
import { initialize } from '../spiders/sources/HeuristicForumScraper';
import { convertLiteParsers } from './scraperLite';
import UniversalParser from '../spiders/parsers/UniversalParser';
import logger from '../lib/logger';
import PuppeteerParserStealth from '../spiders/parsers/PuppeteerParserStealth';

export interface Parser {
  source: SourceType;
  parser: AuthParser | HeuristicForumParser | UniversalParser | PuppeteerParserStealth;
}

export async function getFilenames(folderName: string): Promise<string[]> {
  const files = await glob(`**/${folderName}/**/*.js`);
  return files.filter((f) => f.search(/.test.js/) === -1).map((f) => f.replace(/^dist\//, ''));
}

async function importParsers(fileNames: string[]): Promise<Parser[]> {
  const parsers: Parser[] = await Promise.all(
    fileNames.map((f) => import(path.join(__dirname, f).replace('sources', ''))),
  );
  return parsers.filter((p) => p.parser && p.source);
}

/* eslint-disable global-require,import/no-unresolved */
export async function getParsers(): Promise<Parser[]> {
  if (Application.isLocalDev) {
    return require('./dev').getDevParsers();
  }

  const scraperLiteParsers: Parser[] = await convertLiteParsers();
  const heuristicForumParsers: Parser[] = initialize();

  const DW = await importParsers(await getFilenames('Dark Web'));
  const EA = await importParsers(await getFilenames('EA'));
  const DIP = await importParsers(await getFilenames('DIP'));

  const parsers = [...DIP, ...DW, ...EA, ...heuristicForumParsers, ...scraperLiteParsers];
  const unique = new Set();
  const filterParsers: Parser[] = [];

  parsers.forEach((p) => {
    if (!unique.has(p.source.name)) {
      filterParsers.push(p);
    } else {
      logger.warn(`duplicated parser name: ${p.source.name}`);
    }
    unique.add(p.source.name);
  });

  return filterParsers;
}
