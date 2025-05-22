import { Response } from 'request';
import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Post } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';

const baseURLPrefix = 'http://anzn.net';
const baseURLSuffix = '/sp/?p=13I';
async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const $ = cheerio.load(iconv.decode(response.body, 'euc-jp').toString());
  const elements = $('div[data-role="content"] div[data-role="collapsible"]').get();
  elements.forEach((el) => {
    const dateTime = $(el).find('h3 small:eq(0)').text();
    const date = dateTime.split(' ')[0];
    const time = dateTime.split(' ')[1].replace('頃配信', '');
    const formattedDate = moment(date, 'MM/DD').format('MM/DD/YYYY');
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const keyLocation = $(el).find('h3 small:eq(1)').text();
      const detailedLocation = $(el).find('h3 small:eq(1)').text();
      $(el).find('small').remove();
      const eventType = $(el).find('h3').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const eventDescription = $(el).find('p').text();
      const timestamp = moment(formattedDate, 'MM/DD/YYYY').unix();
      const articleInfo = `${formattedDate} ; ${time} ; ${keyLocation} ; ${detailedLocation} ; ${eventType}`;
      const extraDataInfo = {
        Date: date,
        Time: time,
        'Key Location': keyLocation,
        'Event Type': eventType,
        'Detailed Location': detailedLocation,
        'Event Description': eventDescription,
        ingestpurpose: 'mdsbackup',
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Anzn Tokyo',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },

  ],
  baseURLSuffix,
  {
    encoding: 'binary',
  },
);
