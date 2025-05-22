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
  description: 'General Market',
  isCloudFlare: false,
  name: 'Crime Bay Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://crimebayphqa7yvawea4evgeupys4da6rbrd3fzy5yussop6b5iul6id.onion/search/products',
  randomDelay: [100, 115],
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find(' a[class="is-size-5"]').text().trim();
    const link = $(el).find(' a[class="is-size-5"]').attr('href');
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
  const Description = $(elements).find('p:nth-of-type(3)').text().trim();
  const price = $(elements)
    .find('p[class="title has-text-primary"]')
    .text()
    .trim();
  const title = $(elements).find('h1').text().trim();
  const TermsOfUse = $(elements).find('p:nth-of-type(7)').text().trim();

  const category = $(elements)
    .find('li[class="detail-item"]:nth-of-type(2) a')
    .text()
    .trim();
  const availability = $(elements)
    .find('li[class="detail-item"]:nth-of-type(1) span[class="detail-value"]')
    .text()
    .trim();

  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title};${price}; Description ${Description};Term of Use ${TermsOfUse}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          vendorname: title,
          availability,
          category,
          price,
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
      selector: ['div[class*="column is-12-mobile"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['section[class="section is-main-section"]'],
      handler: postHandler,
    },
  ],
  1440,
);
