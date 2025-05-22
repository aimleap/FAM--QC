import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Darknet Store ',
  type: SourceTypeEnum.FORUM,
  url: 'http://27ezycbepl3hfy5evofi4ctoj3n7b3pwovtnxozazu7xlvsehlvriyad.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
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
    const title = $(el).find('h2').text().trim();
    const link = $(el).find('a:nth-of-type(1)').attr('href');
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
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('nav[class="woocommerce-breadcrumb"]').text().split('/')[2].trim();
    const articlefulltext = $(el).find('div[id="tab-description"] p').contents().text()
      .trim()
      .replace('Description', '')
      .replace(/[\t\n\s]+/g, ' ');
    let price = $(el).find('p[class="price"] ins span[class="woocommerce-Price-amount amount"]').text().trim();
    if (price === '') {
      price = $(el).find('p[class="price"] span[class="woocommerce-Price-amount amount"]').text().trim();
    }
    const timestamp = moment().unix();
    const category = $(el).find('span[class="posted_in"]').text().replace('Category:', '')
      .trim();
    const tag = $(el).find('span[class="tagged_as"]').text().replace('Tags:', '')
      .trim();
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
            articlefulltext,
            price,
            category,
            tag,
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
      name: 'main',
      selector: ['ul[class="sub-menu"] li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-3"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
