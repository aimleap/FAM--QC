import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'Empire Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://2a2a2abbjsjcjwfuozip6idfxsxyowoi3ajqyehqzfqyxezhacur7oyd.onion/',
};

async function mainHanlder($: CheerioSelector, elements: CheerioElement[]): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div').text().trim();
    const link = $(el).attr('href');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
    });
  });
  return items;
}

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el).attr('href');
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
  return elements.map((el) => {
    const title = $(el).find('h1[class="product_title entry-title"]').text().trim();
    const price = $(el)
      .find(
        'div[class="summary entry-summary"] ins span[class="woocommerce-Price-amount amount"] bdi',
      )
      .text()
      .trim();
    const category = $(el)
      .find('div[class="summary entry-summary"] span[class="posted_in"] a')
      .contents()
      .text()
      .trim();
    const articletext = $(el)
      .find(
        'div[class="summary entry-summary"] div[class="woocommerce-product-details__short-description"] p',
      )
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    const reviews = $(el)
      .find('div[class="summary entry-summary"] span[class="count"]')
      .text()
      .trim();
    const timestamp = moment().unix();
    return new Post(
      articletext,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          description: articletext,
          articlefulltext: articletext,
          price,
          category,
          reviews,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    );
  }, []);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['div[class="pcdfwoo-product-cat_inner"] a'],
      handler: mainHanlder,
    },
    {
      name: 'thread',
      selector: ['div[class="tf-loop-product-info-container"] a[class*="link"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['main[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
