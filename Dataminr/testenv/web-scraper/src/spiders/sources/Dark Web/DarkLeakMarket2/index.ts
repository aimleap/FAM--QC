import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Dark Leak Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://darklmmmfuonklpy6s3tmvk5mrcdi7iapaw6eka45esmoryiiuug6aid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el).find('a[class*="LoopProduct-link"]').attr('href');
    const timestamp = moment().unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('p[class="price"]').contents().text()
    .trim();
  const articletext = $(elements)
    .find('div[id="tab-description"] p')
    .contents()
    .text()
    .replace(/(\r\n|\n|\r|\t)/gm, '')
    .trim();
  const category = $(elements).find('span[class="posted_in"] a').contents().text()
    .trim();
  const tags = $(elements).find('span[class="tagged_as"] a').contents().text()
    .trim();
  const timestamp = moment().unix();
  posts.push(
    new Post(
      articletext,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          Product_name: title,
          price,
          categories: category,
          tags,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['form + ul[class="products columns-4"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="woocommerce"]'],
      handler: postHandler,
    },
  ],
  1440,
);
