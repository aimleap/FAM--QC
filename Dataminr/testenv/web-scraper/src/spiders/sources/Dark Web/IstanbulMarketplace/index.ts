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
  description: 'Market',
  isCloudFlare: false,
  name: 'Istanbul Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://istanbulfz7u665mu4zkvfa5r5ss5amyoxdxw2dz67i4lildtphnmkyd.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="button1"]').text().trim();
    const link = `http://istanbulfz7u665mu4zkvfa5r5ss5amyoxdxw2dz67i4lildtphnmkyd.onion${
      $(el).find('a[class="button1"]').attr('href')}`;
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

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a:nth-child(1)').attr('href');
    const title = $(el).find('h4').text().trim();
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
    const title = $(el).find('h1').text().trim();
    const timestamp = moment().unix();
    const price = $(el)
      .find('span[class="woocommerce-Price-amount amount"]')
      .text()
      .trim();
    const articletext = $(el)
      .find('div[class="woocommerce-product-details__short-description"] p')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const category = $(el)
      .find('span[class="posted_in"]')
      .text()
      .replace('Category:', '')
      .trim();
    posts.push(
      new Post(
        title,
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
            category,
            articletext,
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
      name: 'main',
      selector: ['div[id="primary"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="product-loop-wrp"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="primary"] div[class="summary entry-summary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
