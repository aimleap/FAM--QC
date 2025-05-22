import { Response } from 'request';
import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leaks',
  isCloudFlare: false,
  name: 'Dispossessor ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://e27z5kd2rjsern2gpgukhcioysqlfquxgf7rxpvcwepxl4lfc736piyd.onion/back/getallblogs?search=&page=1',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const items: Post[] = [];
  const jsonData = JSON.parse(response.body);
  jsonData.data.items.forEach((el:any) => {
    const companyName = el.company_name;
    const articlefulltext = el.description.replace(/[\t\n\s]+/g, ' ');
    const published = el.is_published === 0 ? 'no' : 'yes';
    const date = el.uploaded_date.replace(' UTC', '');
    const timestamp = moment.utc(date, 'DD MMM, YYYY hh:mm:ss ZZZ').unix();
    const text = `${companyName}; ${articlefulltext}`;
    if (timestamp !== 0) {
      items.push(
        new Post(
          text,
          {
            current_url: 'http://e27z5kd2rjsern2gpgukhcioysqlfquxgf7rxpvcwepxl4lfc736piyd.onion/dashboard',
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: companyName,
              domain: companyName,
              published,
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return items;
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
