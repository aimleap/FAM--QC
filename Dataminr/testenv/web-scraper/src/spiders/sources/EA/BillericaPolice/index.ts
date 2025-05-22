import cheerio from 'cheerio';
import request from 'request-promise';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import moment from 'moment';
import { v4 as Uuid } from 'uuid';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import AuthParser from '../../../parsers/AuthParser';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Billerica Police',
  type: SourceTypeEnum.FORUM,
  url: 'https://police.billericaps.com/index.php/media_log_portal/',
};

const requestHeaders = {
  authority: 'log.billericaps.org',
  accept: '*/*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  origin: 'https://log.billericaps.org',
  referer: 'https://log.billericaps.org//ReportCadMediaLog/ReportView',
  'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest, XMLHttpRequest',
};

async function postHandler($: CheerioSelector): Promise<Post[]> {
  const posts: Post[] = [];
  const requestID = Uuid();
  const startDate = moment.utc().subtract(5, 'd').format('MM/DD/YYYY');
  const endDate = moment.utc().format('MM/DD/YYYY');
  const options = {
    url: `https://log.billericaps.org/ReportCadMediaLog/List?RequestId=${requestID}&FromDate=${startDate}&ToDate=${endDate}`,
    method: 'POST',
    headers: requestHeaders,
    body: 'X-Requested-With=XMLHttpRequest',
  };
  const resp = await request(options);
  const parsedResponse = cheerio.load(resp);
  const entryData = parsedResponse('table tr.row').get();
  entryData.forEach((el) => {
    const date = $(el).find('td:nth-child(2)').text().trim();
    const location = $(el)
      .find('td:nth-child(3)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const event = $(el)
      .find('td:nth-child(4)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const incident = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = adjustTimezone(
      moment(date, 'MM/DD/YYYY hh:mm').format('YYYY-MM-DD hh:mm A'),
      TIME_ZONE['Etc/GMT+6'],
    );
    if (event === '') return;
    posts.push(
      new Post(
        `Event Type: ${incident}; DateTime: ${date}; Location: ${location}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            eventtype: incident,
            datetime: date,
            location,
            ingestpurpose: 'deepweb',
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
