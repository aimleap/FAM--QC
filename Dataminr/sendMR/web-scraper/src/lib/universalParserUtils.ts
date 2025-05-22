import Post from '../schema/post';
import { publish } from './aws/publisher';
import Source from '../schema/source';
import { ProcessedItem } from '../spiders/parsers/universalScraperDomains';
import { SourceType } from './parserUtil';
import { getLatestConfig } from './cacheUtil';
import { source as UniversalScraper } from '../spiders/sources/EA/UniversalScraper';

export function getSource(domain: ProcessedItem, source: SourceType): Source {
  return new Source(domain.baseUrl, source.type, source.description, domain.dataSource);
}

export async function getDomain(name: string): Promise<ProcessedItem | null> {
  const domains = await getLatestConfig(UniversalScraper.name);
  if (domains === null || !domains.hasOwnProperty(name)) return null;
  // @ts-ignore
  return domains[name];
}

export const getPublishTask = (
  message: Post,
  domain: ProcessedItem,
  crawledAt: number,
  source: SourceType,
) => publish(getSource(domain, source), message, crawledAt, domain.baseUrl);
