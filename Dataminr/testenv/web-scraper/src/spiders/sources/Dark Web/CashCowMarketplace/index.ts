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
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Cash Cow Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://hssza6r6fbui4x452ayv3dkeynvjlkzllezxf3aizxppmcfmz2mg7uad.onion/market/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text();
    const link = $(el)
      .find(
        'div[class="wcfmmp_sold_by_wrapper"]  a[class*="woocommerce-LoopProduct-link"]',
      )
      .attr('href');
    const timestamp = moment().unix();

    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
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
  return elements
    .map((el) => {
      const title = $(el).find('h1').text().trim();
      const price = $(el).find('p[class="price"] bdi').text().trim();
      const articlefulltext = $(el)
        .find('div[id="tab-description"]')
        .contents()
        .text()
        .replace(/[\t\n\s]+/g, ' ');

      const timestamp = moment().unix();
      const text = `${articlefulltext}\n${title}`;
      return new Post(
        text,
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
      );
    }, [])
    .filter(Boolean);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['ul[class="products columns-4"] li[class*="product"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['article'],
      handler: postHandler,
    },
  ],
  1440,
);
