import { Response } from 'request';
import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Post } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';

const domainUrl = 'https://bugtraq.ru/review/';
async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const $ = cheerio.load(iconv.decode(response.body, 'windows-1251').toString());
  const elements = $('table div.l index p.l').get();
  elements.forEach((el) => {
    const dateTime = $(el).toString().split('<br>')[1].split('//')[1].trim();
    const date = dateTime.split(' ')[0];
    const time = dateTime.split(' ')[1];
    const formattedDate = moment(date, 'DD.MM.YY').format('MM/DD/YYYY');
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const title = $(el).find('b').text();
      const postText = $(el).text().split(`${dateTime}`)[1].replace(/\n+/g, '').trim();
      const timestamp = moment(dateTime, 'DD.MM.YY hh:mm').unix();
      const articleInfo = `${title}; ${formattedDate}; ${time}; ${postText}`;
      const extraDataInfo = {
        title,
        date: formattedDate,
        time,
        postText,
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: domainUrl,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'BugTraq Forum',
  domainUrl,
  [
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  {
    encoding: 'binary',
  },
);
