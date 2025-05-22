import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Cards',
  isCloudFlare: false,
  name: 'Profit Money Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://dickvoz3shmr7f4ose43lwrkgljcrvdxy25f4eclk7wl3nls5p5i4nyd.onion/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text().trim();
    const link = `http://dickvoz3shmr7f4ose43lwrkgljcrvdxy25f4eclk7wl3nls5p5i4nyd.onion${$(el).attr('href').slice(1)}`;
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
  const posts: Post[] = [];
  elements.forEach((el) => {
    const timestamp = moment().unix();
    const title = $(el).find('div[class="wc-block-grid__product-title"]').text().trim();
    const price = $(el).find('span[class="woocommerce-Price-amount amount"]').text().trim();
    posts.push(
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
            ingestpurpose: 'darkweb',
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
      selector: ['figcaption[class="blocks-gallery-item__caption"] a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['li[class="wc-block-grid__product"]'],
      handler: postHandler,
    },
  ],
  1440,
);
