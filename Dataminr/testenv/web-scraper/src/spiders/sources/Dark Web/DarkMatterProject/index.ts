import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Dark Matter Project',
  type: SourceTypeEnum.FORUM,
  url: 'http://dark4s5k7jw5zjgkm5wzo3zbvwpwvzi7gqo5kpvzfggtcnzexdu7gsyd.onion/',
};

async function mainHandler($: CheerioSelector, elements: CheerioElement[]): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a h2').text().trim();
    const link = $(el).find('a').attr('href');
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
  const title = $(elements)
    .find('div[class="term-description"] p')
    .contents()
    .text()
    .trim()
    .replace(/(\r\n|\n|\r|\s|\t)/gm, '');
  const entrySelector = $(elements).find('ul[class="products columns-6"] li').get();
  entrySelector.forEach((el) => {
    const link = $(el)
      .find('a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]')
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
  return elements.map((el) => {
    const title = $(el).find('h1').text().trim();
    const price = $(el)
      .find('div[class="summary entry-summary"] span[class="woocommerce-Price-amount amount"] bdi')
      .contents()
      .text()
      .trim();
    const category = $(el)
      .find('div[class="summary entry-summary"] span[class="posted_in"] a')
      .contents()
      .text()
      .trim();
    const articletext = $(el)
      .find('div[id="tab-description"]')
      .contents()
      .text()
      .replace('Description', '')
      .trim()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    const timestamp = moment().unix();
    return new Post(
      title,
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
      selector: ['ul[class="products columns-4"] li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['main[id="main"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['main[id="main"] article'],
      handler: postHandler,
    },
  ],
  1440,
);
