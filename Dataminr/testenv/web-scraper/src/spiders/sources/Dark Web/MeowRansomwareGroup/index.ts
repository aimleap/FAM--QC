import moment from 'moment';
import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leaks site',
  isCloudFlare: true,
  name: 'Meow Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'https://intercorporal.hellojohnkipper12.com/post/getPosts?page=1&search=',
  // entryUrl: 'getAllStories?search=&page=1',
  requestOption: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Origin: 'null',
      Connection: 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'If-None-Match': 'W/34db-dk//aTr6xlD2r/hTisFAC9MChMQ',
      TE: 'trailers',
    },
  },
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
  jsondata.data.posts.forEach((item:any) => {
    const { title } = item;
    const articleFullText = item.description.replace(/<[^>]*>/g, '');
    const { price } = item;
    const { createdAt } = item;
    const posturl = 'http://meow6xanhzfci2gbkn3lmbqq7xjjufskkdfocqdngt3ltvzgqpsg5mid.onion';
    const timestamp = moment(createdAt).unix();
    posts.push(
      new Post(
        `${title}; ${price} ; ${articleFullText}`,
        {
          current_url: posturl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            price,
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
