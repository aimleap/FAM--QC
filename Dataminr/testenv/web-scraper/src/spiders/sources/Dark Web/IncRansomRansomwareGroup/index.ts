import moment from 'moment';
import { Response } from 'request';
import _ from 'lodash';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: true,
  name: 'IncRansomRansomwareGroup',
  type: SourceTypeEnum.FORUM,
  url: 'http://incbackfgm7qa7sioq7r4tdunoaqsvzjg5i7w46bhqlfonwjgiemr7qd.onion',
  expireIn: 200,
};

interface IncRansomwareCompany {
  company_name: string;
  country: string;
  revenue: number;
}
interface IncRansomwareAnnouncement {
  _id: string;
  company: IncRansomwareCompany;
  description: string[];
  createdAt: number;
}
interface IncRansomwarePayload {
  length: number;
  announcements: IncRansomwareAnnouncement[];
}
interface IncRansomResponse {
  message: string;
  payload: IncRansomwarePayload;
}

async function threadHandler(): Promise<ThreadType[]> {
  const PAGES = 6;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  return [...Array(PAGES)].map((__, page) => ({
    title: `page-${page}`,
    link: `${source.url}/api/v1/blog/get/announcements?page=${page}&perPage=15`,
    parserName: 'post',
    timestamp: moment().unix(),
    delay: _.random(5, 10) * 1000,
    requestOption: {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US;q=0.5,en;q=0.3',
        Connection: 'keep-alive',
        Origin: 'http://incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad.onion',
        Referer: 'http://incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad.onion/',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    },
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  if (response.statusCode !== 200) return [];
  const data: IncRansomResponse = JSON.parse(response.body);
  return data.payload.announcements.map(
    (announcement) => new Post(
      `${decodeURIComponent(announcement.company.company_name)}; ${decodeURIComponent(
        announcement.description.join(' '),
      )}; ${announcement.createdAt}`,
      {
        // eslint-disable-next-line no-underscore-dangle
        current_url: `http://incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad.onion/blog/disclosures/${announcement._id}`,
      },
      announcement.createdAt,
      [],
      [],
      new Map(
        Object.entries({
          entity: decodeURIComponent(announcement.company.company_name),
          date: announcement.createdAt,
          description: decodeURIComponent(announcement.description.join(' ')),
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'entry',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
