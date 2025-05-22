import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Dark Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://4uasd75w424pn73etyjufvtiqg62csm5nnwk3twfnjhvsw3mkjrp3kad.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('strong').text().trim();
    const link = $(el).attr('href');
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
  elements.forEach((el) => {
    const title = $(el).find('p[class*="name product-title"] a').text().trim();
    const link = $(el).find('p[class*="name product-title"] a').attr('href');
    const timestamp = moment().unix();

    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('h1[class="product-title product_title entry-title"]')
      .text()
      .trim();
    const price = $(el).find(' div[class="price-wrapper"]').text().trim();
    const articlefulltext = `${title}\n${price}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        articlefulltext,
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
            articlefulltext,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });

  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['div[class="col-inner"] p a:nth-child(2)'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="box-text box-text-products"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="product-main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
