import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'RansomWatch',
  type: SourceTypeEnum.FORUM,
  url: 'https://ransomwatch.telemetry.ltd/recentposts.md',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.body === null) return [];
  const data = response;
  const data1 = data.body.split('|---|---|---|\n')[1];
  const lines = data1.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const linedata = line.split(' | ');
    const date = String(linedata[0]).split(' ')[1];
    const title = String(linedata[1]).split('`]')[0].replace('[`', '');
    const group = String(linedata[2]).split(']')[0].replace('[', '');
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
    const link = 'https://ransomwatch.telemetry.ltd/#/recentposts';
    posts.push(new Post(
      `${title}\n${group}`,
      {
        current_url: link,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          date,
          group,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  }
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
