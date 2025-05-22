import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Hidden Card',
  type: SourceTypeEnum.FORUM,
  url: 'http://nhkotz23d7zbxbdjupg4rptjzcaruqwx2qy7qwtby3hon5rr4yaddfqd.onion/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    const title = $(ele).text().trim();
    const timestamp = moment().unix();
    posts.push(new Post(
      `${title}`,
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
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['h3 + h6'],
      handler: postHandler,
    },
  ],
  1440,
);
