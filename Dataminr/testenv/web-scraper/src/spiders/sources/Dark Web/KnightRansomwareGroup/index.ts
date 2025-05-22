import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks site',
  isCloudFlare: false,
  name: 'Knight Ransomeware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://knight3xppu263m7g4ag3xlit2qxpryjwueobh7vjdc3zrscqlfu3pqd.onion/search/',
  requestOption: { method: 'GET' },
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);
  const data = jsondata.posts;

  data.forEach((item: any) => {
    const title = item.name;
    const link = `http://knight3xppu263m7g4ag3xlit2qxpryjwueobh7vjdc3zrscqlfu3pqd.onion${item.url}`;
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
  const title = $(elements)
    .find('h4[class="py-4 mb-3"]')
    .clone()
    .find('a')
    .remove()
    .end()
    .text()
    .trim();
  const time = $(elements)
    .find(
      'div[class="d-flex justify-content-between align-items-center mb-4"] small:nth-of-type(2)',
    )
    .text()
    .trim();
  const timestamp = moment.utc(time, 'YYYY-MM-DD').unix();
  const articletext = $(elements)
    .find('div[class="card-body"]:first')
    .contents()
    .text()
    .replace(/\S+\.(onion)\b/g, '')
    .replace(/[\t\n\s]+/g, ' ')
    .trim();
  posts.push(
    new Post(
      `${articletext}\n${title}`,
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
          articlefulltext: articletext,
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
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content-wrapper"]'],
      handler: postHandler,
    },
  ],
  1440,
);
