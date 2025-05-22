import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: 'Autodesk',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.autodesk.com',
  entryUrl: '/trust/security-advisories',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const link = $(el).find('a[data-wat-val="link"]').attr('href');
    const dateArray = $(el)
      .find('p[class="wd-font-16 wd-light wd-mt-8"]')
      .text()
      .trim()
      .split('\n');
    const date = dateArray.length === 1
      ? dateArray[0].split(',')[0].trim()
      : dateArray[1].split(',')[0].trim();
    const timestamp = moment.utc(date, 'MM/DD/YYYY').unix();
    items.push({
      title,
      link: !link.startsWith('https') ? `${source.url}${link}` : link,
      timestamp,
      parserName: 'post',
    });
  });
  return items.filter((item) => item.timestamp);
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const text = $(elements)
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const autodeskId = text.match(/Autodesk ID: ([^\s]+)/i)?.[1];
  const productServiceComponent = text
    .match(/Product, Service, Component: ([^:]+?)(?=\sImpact:)/i)?.[1]
    .trim();
  const impactRegex = /Impact: ([^:]+?)(?=Severity:|Original Publish:)/i;
  const impact = text.match(impactRegex)?.[1].trim();
  const severity = text.match(/Severity: (\w+)/i)?.[1];
  const originalPublish = text.match(/Original Publish: (\d{2}\/\d{2}\/\d{4})/i)?.[1];
  const lastRevised = text.match(/Last Revised: (\d{2}\/\d{2}\/\d{4})/i)?.[1];
  const cves = $(elements)
    .find('a[href*="CVERecord"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(', ');
  const title = $(elements)
    .find('h2[class="cmp-title__text wp-heading-large pc-brand"]')
    .text()
    .trim();
  const timestamp = moment.utc(originalPublish, 'MM/DD/YYYY hh:mm').unix();
  const affectedProducts = $(elements)
    .find('div[class="cmp-container wd-pv-64 "] table[style="width: 100.0%;"] tbody tr')
    .get();
  const affectedProductsString = affectedProducts.map((el) => $(el).text().trim()).join(', ');
  items.push(
    new Post(
      `Title:${title}; Product, Service, Component: ${productServiceComponent}; Impact: ${impact}; Original Publish: ${originalPublish}; Last Revised: ${lastRevised}; CVE: ${cves}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          autodeskid: autodeskId,
          severity,
          affectedProduct: affectedProductsString,
          cves,
          created: originalPublish,
          modified: lastRevised,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['ul.cmp-responsivelist div.core-container'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[role="main"]'],
      handler: postHandler,
    },
  ],
  14400,
);
