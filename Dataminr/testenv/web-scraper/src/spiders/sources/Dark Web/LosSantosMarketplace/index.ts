import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Los Santos Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://oolyc7twrmp6kq7ire3bkqvdqmnjwzmh4p7lbufms6yphjxhg36mujid.onion/',
};

async function mainHandler($: CheerioSelector, elements: CheerioElement[]): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="price-value"]').text().trim();
    const link = `http://oolyc7twrmp6kq7ire3bkqvdqmnjwzmh4p7lbufms6yphjxhg36mujid.onion/${$(el)
      .find('div[class="plan-signup"] a')
      .attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'thread',
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const processedLinks = new Set<string>();
  elements.forEach((el) => {
    const title1 = $(el).find('div[class="price-value"]').text().trim();
    if (title1) {
      const title = $(el).find('div[class="price-value"]').text().trim();
      const link = `http://oolyc7twrmp6kq7ire3bkqvdqmnjwzmh4p7lbufms6yphjxhg36mujid.onion/${$(el)
        .find('a[class="btn-system"]')
        .attr('href')}`;
      const timestamp = moment().unix();
      if (!processedLinks.has(link)) {
        processedLinks.add(link);
        items.push({
          title,
          link,
          timestamp,
          parserName: 'post',
        });
      }
    }
  });
  return items;
}

function processPricePost($: CheerioSelector, priceContainer: any, url: string): Post[] {
  const entrySelector = $(priceContainer).find('div[class*="pricing-table"]').get();
  const items: Post[] = [];
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="price-value"]').text().trim();
    const price = $(el).find('div[class="plan-list"] ul li:nth-child(2) strong').text().trim();
    const articleFullText = $(el)
      .find('div[class="plan-list"] ul li:first')
      .contents()
      .text()
      .trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${title}\n${price}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            price,
            articleFullText,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}

function processTablePost($: CheerioSelector, tableContainer: any, url: string): Post[] {
  const entrySelector = $(tableContainer).find('tr').get().slice(1);
  const items: Post[] = [];
  entrySelector.forEach((el) => {
    const email = $(el).find('td:nth-of-type(1)').text().trim();
    const country = $(el).find('td:nth-of-type(2)').text().trim();
    const accountStatus = $(el).find('td:nth-of-type(3)').text().trim();
    const balance = $(el).find('td:nth-of-type(4)').text().trim();
    const price = $(el).find('td:nth-of-type(5)').text().trim();
    const articleFullText = `${country}\n${email}\n${accountStatus}\n${balance}\n${price}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        articleFullText,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: email,
            email,
            country,
            accountStatus,
            balance,
            price,
            articleFullText,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const priceContainer = $(el).find(
      'div[class="text-center"] div[class="container"] div[class="col-md-4 col-sm-4"]',
    );
    const tableContainer = $(el).find('table tbody');
    if (priceContainer.length > 0) {
      const pricePosts = processPricePost($, priceContainer, url);
      items.push(...pricePosts);
    }
    if (tableContainer.length > 0) {
      const tablePosts = processTablePost($, tableContainer, url);
      items.push(...tablePosts);
    }
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['div[class="intro-text"] div[class="container"] div[class="col-md-3 col-sm-3"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="col-md-4 col-sm-4"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['header[id="header"]'],
      handler: postHandler,
    },
  ],
  1440,
);
