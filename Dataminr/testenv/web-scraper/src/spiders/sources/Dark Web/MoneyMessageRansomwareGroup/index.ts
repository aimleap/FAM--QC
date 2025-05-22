import moment from 'moment';
import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'Money Message Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd.onion/news.php?allNewsPage=1',
  expireIn: 200,
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const jsondata = JSON.parse(response.body);
  jsondata.forEach((item: any) => {
    const title = item.name;
    const { updatedDate } = item;
    const { createdDate } = item;
    const timestamp = moment.utc(updatedDate, 'YYYY.MM.DD').unix();
    posts.push(
      new Post(
        title,
        {
          current_url:
            'http://blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd.onion/news.php',
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            date: updatedDate,
            createdDate,
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
