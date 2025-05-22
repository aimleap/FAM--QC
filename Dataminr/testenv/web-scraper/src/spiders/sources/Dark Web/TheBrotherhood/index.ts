import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'The Brotherhood',
  type: SourceTypeEnum.FORUM,
  url: 'http://gabnubw6cytbgfn2665r76sd3n5adzegb2rkloz4tg7sndc5tpwqk3ad.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h3:first-of-type').text().trim();
  const entrySelector = $(elements).find('p').get();
  entrySelector.forEach((el) => {
    const content = $(el).text().trim();
    const [articlefulltext, price] = content.includes('Cost') ? content.split(', ') : [content, ''];
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}\n${title}\n${price}`,
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
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="box"]'],
      handler: postHandler,
    },
  ],
  1440,
);
