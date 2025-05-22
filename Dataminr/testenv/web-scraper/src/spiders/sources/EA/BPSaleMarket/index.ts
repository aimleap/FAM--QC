import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forum Site',
  isCloudFlare: true,
  name: 'B-P Sale Market',
  type: SourceTypeEnum.FORUM,
  url: 'https://b-p.sale/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('div[class="section-product"]').get().slice(24, 34);
  entrySelector.forEach((el) => {
    const entrySelector2 = $(el).find('div[class="product-item"]').get();
    entrySelector2.forEach((el1) => {
      const link1 = $(el1).find('a[class="product-item-content"]').attr('href');
      if (link1) {
        const title = $(el1).find('a[class="product-item-content"]').text().trim();
        const link = `https://b-p.sale${$(el1).find('a[class="product-item-content"]').attr('href')}`;
        const timestamp = moment().unix();
        items.push({
          title,
          link,
          timestamp,
          parserName: 'post',
        });
      }
    });
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
  const posts: Post[] = [];
  const title = $(elements).find('h1[class="product-width-title"]').text().trim();
  const forum = $(elements).find('ul[class="breadcrumbs"] li:nth-of-type(2)').text().trim();
  const subforum = $(elements).find('ul[class="breadcrumbs"] li:nth-of-type(3)').text().trim();
  elements.forEach((el) => {
    const quantity = $(el).find('div[class="product-item-props_stock"]').text().trim();
    const priceperpiece = $(el).find('div[class="product-item-props_price"]').text().trim();
    const timestamp = moment().unix();
    const articlefulltext = $(el).find('div[class="product-width-content idesc"]').contents().text()
      .replace('Description:', '')
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
            forum,
            subforum,
            articlefulltext,
            quantity,
            priceperpiece,
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [

    {
      name: 'thread',
      selector: ['main[class="content"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[class="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
