import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forum',
  isCloudFlare: false,
  name: 'UnSafe Team',
  type: SourceTypeEnum.FORUM,
  url: 'http://unsafeipw6wbkzzmj7yqp7bz6j7ivzynggmwxsm6u2wwfmfqrxqrrhyd.onion/',
  entryUrl: 'api/posts?page=0',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: String[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.body === null) {
    return [];
  }
  const jsondata = JSON.parse(response.body);
  jsondata.forEach((item: any) => {
    const domain = item.website;
    const { title } = item;
    const articletext = typeof item.content === 'string' ? item.content.replace(/<.*?>/g, '') : item.content;
    const { country } = item;
    const { revenue } = item;
    const date = item.encrypted_at;
    const timestamp = moment.utc(date).unix();
    const text = `${articletext}\n${title}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            CompanyName: title,
            title,
            articletext,
            domain,
            country,
            revenue,
            CompromisedOn: date,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
