import moment from 'moment';
import cheerio from 'cheerio';
import request from 'request-promise';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const contentUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcy8dJv4WOfBl4PY9-ZkpOhosOADKZQLUNftptlnDwyxC64cZHIf5_WOec90TLtfwFbfTjf0dont8S/pubhtml/sheet?headers=false&gid=0';
const domainUrl = 'https://www.downhound.com/';

async function postHandler(): Promise<Post[]> {
  const response = await request({
    url: contentUrl,
    method: 'get',
    resolveWithFullResponse: true,
  });
  const $ = cheerio.load(response.body);
  const elements = $('tr').get();

  const DATE_FORMAT = 'MMM D, YYYY, h:mmA';

  moment.locale('en');
  const now = moment();

  return elements
    .filter((el) => {
      const date = $(el).find('td:eq(0)').text();
      return now.isSame(moment(date, DATE_FORMAT), 'day');
    })
    .map((el) => {
      const brand = $(el).find('td:eq(1)').text();
      const status = $(el).find('td:eq(2)').text();
      const details = $(el).find('td:eq(3)').text();
      const support = $(el).find('td:eq(4)').text();
      const date = $(el).find('td:eq(0)').text();
      const timestamp = moment(date, DATE_FORMAT).unix();
      const scamInfo = `${date} ; ${brand} ; ${status} ; ${details} ; ${support}`;
      const extraDataInfo = {
        Time: date,
        Brand: brand,
        Status: status,
        Details: details,
        Support: support,
      };
      return new Post({
        text: scamInfo,
        postUrl: domainUrl,
        postedAt: timestamp,
        extraData: extraDataInfo,
      });
    });
}

export const parser = new LiteParser('Downhound', domainUrl, [
  {
    selector: ['*'],
    parser: postHandler,
  },
]);
