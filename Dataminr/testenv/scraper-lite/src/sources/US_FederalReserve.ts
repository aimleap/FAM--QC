import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body.trim());
  jsonArray.forEach((jObj: any) => {
    if (jObj.hasOwnProperty('d')) {
      const speechPublishedDate = moment(jObj.d, 'L').format('MM/DD/YYYY');
      if (moment(speechPublishedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
        const href = jObj.l;
        const headline = jObj.t;
        threads.push({
          link: href,
          title: headline,
          parserName: 'post',
        });
      }
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  if (url === 'https://www.federalreserve.gov/json/ne-speeches.json') {
    return posts;
  }
  const title = $el.find('h3.title').text().trim();
  const description = $el.find('.speaker').text().trim();
  const date = moment($el.find('.article__time').text().replace(/\n+/g, '').trim(), 'LL').format(
    'MM/DD/YY',
  );
  const source = 'US Federal Reserve';
  const type = 'Speech';
  const speechText = $el.find('#article div:nth-child(3)').text().replace(/\n+/g, '').trim();
  const speechVenue = $el.find('.location').text().replace(/\n+/g, '').trim();
  const timestamp = moment(date, 'MM/DD/YY').unix();

  const speechInfo = `Title: ${title}, Description: ${description}, Date: ${date}, Source: ${source}, Type: ${type}`;
  const extraDataInfo = {
    Title: title,
    Description: description,
    Date: date,
    Source: source,
    Type: type,
    'Additional Data': `${url} ; ${speechVenue} ; ${speechText} `,
  };

  posts.push(
    new Post({
      text: speechInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US Federal Reserve',
  'https://www.federalreserve.gov',
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['.container__main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/json/ne-speeches.json',
);
