import { getSources, parserImport } from 'scraper-lite/dist/lib/wrapper';
import LiteParser from 'scraper-lite/dist/lib/parsers/liteParser';
import { Response } from 'request';
import AuthParser from '../spiders/parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../lib/parserUtil';
import { ParserStruct } from '../spiders/parsers/Parser';
import PuppeteerParserStealth from '../spiders/parsers/PuppeteerParserStealth';

type parserObj = {
  source: SourceType;
  parser: AuthParser | PuppeteerParserStealth;
};

const sourceDefault: SourceType = {
  description: 'Malicious Forum',
  isCloudFlare: true,
  name: '',
  type: SourceTypeEnum.FORUM,
  url: '',
};

const sourceMap: { [key: string]: { backfilledMinutes: number } } = {};

function getSourceDefault(): SourceType {
  return {
    ...sourceDefault,
  };
}

function getSource(p: parserImport): SourceType {
  return {
    ...getSourceDefault(),
    name: p.parser.sourceName,
    url: p.parser.sourceUrl,
    requestOption: p.parser.options,
    entryUrl: p.parser.entryUrl,
  };
}

function getBackFilledMinutes(p: parserImport): number {
  return p.parser.sourceName in sourceMap ? sourceMap[p.parser.sourceName].backfilledMinutes : 2880;
}

function getLiteParser(p: parserImport): parserObj {
  const source = getSource(p);

  // @ts-ignore
  const handlers: ParserStruct[] = p.parser.handlers.map((h) => ({
    name: 'name' in h && h.name !== undefined ? h.name : '',
    selector: h.selector,
    handler: (
      $: CheerioSelector,
      elements: CheerioElement[],
      forumPaths: string[],
      backFilledTimestamp: number,
      url: string,
      response: Response,
    ) => h.parser($, elements, url, forumPaths, response),
  }));

  return { source, parser: new AuthParser(source, handlers, getBackFilledMinutes(p)) };
}

function getPuppeteerParser(p: parserImport): parserObj {
  const source = getSource(p);
  return {
    source,
    // @ts-ignore
    parser: new PuppeteerParserStealth(source, p.parser.handlers, getBackFilledMinutes(p)),
  };
}

export async function convertLiteParsers(): Promise<parserObj[]> {
  const liteParsers: parserImport[] = await getSources();

  const parsers: parserObj[] = [];

  liteParsers.forEach((p) => {
    if (p.parser instanceof LiteParser) parsers.push(getLiteParser(p));

    // instanceof PuppeteerParser not working :(
    if (p.parser.constructor.name === 'PuppeteerParser') parsers.push(getPuppeteerParser(p));
  });

  return parsers.filter((x) => x !== null);
}
