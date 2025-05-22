import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Amazon Gift Cards',
  type: SourceTypeEnum.FORUM,
  url: 'http://2ldijxdic73f2hpjcmjaiqz3xodlx36d57q7o7psfe42lzb7qicyp2yd.onion',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const articletext = $(elements).find('p[style="line-height: 32px;"]').contents().text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const title = $(elements).find('td[style="padding: 18px 0px 14px 0px;"] td[style="padding: 18px 0px 0px 0px;"]').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const text = `${articletext}\n${title}`;
  const timestamp = moment().unix();
  posts.push(new Post(
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
        articlefulltext: `${title}\n${articletext}`,
        ingestpurpose: 'darkweb',
        parser_type: PARSER_TYPE.AIMLEAP_PARSER,
      }),
    ),
  ));
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['td[style="border: 1px solid #cfd0cf;"]'],
      handler: postHandler,
    },
  ],
  1440,
);
