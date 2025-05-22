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
  description: 'Market',
  isCloudFlare: false,
  name: 'Guns R Us',
  type: SourceTypeEnum.FORUM,
  url: 'http://7vugm3oxopbinxokowyjf22rmiezir2feifdl6d7huerw626okqez4id.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a h2').text().trim();
    const link = $(el)
      .find('a[class*="woocommerce-LoopProduct-link"]')
      .attr('href');

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
  const articlefulltext = $(elements)
    .find('div[id="tab-description"] p')
    .text()
    .trim();
  const tags = $(elements).find('span[class="posted_in"] a').text().trim();
  const timestamp = moment().unix();
  const text = `${title}\n${articlefulltext}`;

  posts.push(
    new Post(
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
          articlefulltext,
          tags,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['ul[class="products columns-4"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="primary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
