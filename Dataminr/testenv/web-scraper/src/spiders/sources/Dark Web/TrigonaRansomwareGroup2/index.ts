import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { getResponse } from '../../../../lib/crawler';

export const source: SourceType = {
  description: 'Leak Site',
  isCloudFlare: false,
  name: 'Trigona Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://trigonax2zb3fw34rbaap4cqep76zofxs53zakrdgcxzq6xzt24l5lqd.onion/api?page=1',
  expireIn: 200,
};

async function postHandler(): Promise<Post[]> {
  const posts: Post[] = [];
  const requestUrl = `${source.url}`;
  const response = await getResponse(
    {
      url: requestUrl,
      method: 'GET',
    },
    source.isCloudFlare,
    source.name,
  );
  if (response.statusCode !== 200) return [];

  const jsondata = JSON.parse(response.body);

  jsondata.data.leaks.forEach((item: any) => {
    const { title } = item;
    const articlefulltext = item.short_descryption
      .replace(/<.*?>/g, '')
      .replace(/[\r\t\n\s]+/g, ' ');
    const price = item.blitz_price;
    const status = item.status.name;
    const createdAt = item.created_at;
    const link = `${source.url}/leak/${item.rndid}`;
    const timestamp = moment(createdAt).unix();
    const text = `${articlefulltext}\n${title}`;
    posts.push(
      new Post(
        text,
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
            articlefulltext,
            price,
            status,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  }, []);
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
