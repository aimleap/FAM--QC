import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const today = moment();
  const twoDaysAgo = moment().subtract(2, 'days');
  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('td:eq(2)').text();
    const publishedDate = moment(date, 'MMMM D, YYYY');
    if (publishedDate.isBetween(twoDaysAgo, today)) {
      const href = $el.find('td>a').attr('href');
      const headline = `${$el.find('td:eq(1)').text()}#${$el.find('td:eq(2)').text()}`;
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);

  if (url === 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html') {
    return posts;
  }

  const advisory = $el.find('h1').text().trim();
  const advisoryLevelDateInfo = typeof data[0] !== 'undefined' ? data[0].split('#') : '';
  const level = advisoryLevelDateInfo[0];
  const date = advisoryLevelDateInfo[1];
  const description = $el.find('.tsg-rwd-emergency-alert-text').text().replace(/\n+/g, '').trim();
  const timestamp = moment(date, 'LL').unix();

  const travelInfo = `Advisory: ${advisory}, Level: ${level}, Date Updated: ${date}, Description: ${description}`;
  const extraDataInfo = {
    Advisory: advisory,
    Level: level,
    'Date Updated': date,
    Description: description,
  };
  posts.push(
    new Post({
      text: travelInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );

  return posts;
}

export const parser = new LiteParser(
  'US State Department Consular Affairs',
  'https://travel.state.gov',
  [
    {
      selector: ['.table-data>table>tbody>tr:not(:has(th))'],
      parser: threadHandler,
    },
    {
      selector: ['.tsg-rwd-main-copy-body-frame'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/content/travel/en/traveladvisories/traveladvisories.html',
);
