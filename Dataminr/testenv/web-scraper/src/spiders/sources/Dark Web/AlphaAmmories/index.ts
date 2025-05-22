import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'Alpha Ammories',
  type: SourceTypeEnum.FORUM,
  url: 'http://lmo7lrurzcrplbsbo4nou7sr3sxqqiyb3qgnd6q6hc3mjjb457ufqkqd.onion/shop/',
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 4; i++) {
    items.push({
      title: '',
      link: `${source.url}page/${String(i)}/`,
      parserName: 'post',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2[class="woocommerce-loop-product__title"] a').text().trim();
    const link = $(el).find('h2[class="woocommerce-loop-product__title"] a').attr('href');
    const price1 = $(el)
      .find('span[class="woocommerce-Price-amount amount"]')
      .contents()
      .text()
      .trim();
    const formattedPrice = parseFloat(price1.replace(/[^\d.-]/g, '')); // Extract numerical value from the string
    const price = (formattedPrice / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
        {
          current_url: link,
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
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'post',
      selector: ['div[class="shop-preview-container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
