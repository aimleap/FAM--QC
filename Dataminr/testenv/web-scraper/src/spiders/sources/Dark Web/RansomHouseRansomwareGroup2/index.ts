import moment from 'moment';
import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'RansomHouse Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid.onion/a',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const data = JSON.parse(response.body);
  const jsonData = data.data.slice(1);
  jsonData.forEach((el: any) => {
    const title = el.header;
    const domain = el.url;
    const link = `http://zohlm7ahjwegcedoz7lrdrti7bvpofymcayotp744qhx6gjmxbuo2yid.onion/r/${el.id}`;
    const { status } = el;
    const { action } = el;
    const date = el.actionDate;
    const timestamp = moment(date, 'DD/MM/YYYY').unix();
    const articlefulltext = el.info.trim().replace(/[\t\n\s]+/g, ' ');
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            domain,
            title,
            status,
            action,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
