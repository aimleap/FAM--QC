import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const todaysDate = moment().format('DD MMMM, YYYY');
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('a').text();
    if (title.includes(todaysDate)) {
      const href = $el.find('a').attr('href');
      threads.push({
        link: href,
        title: `${todaysDate}`,
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

  if (url === 'https://fr.usembassy.gov/u-s-citizen-services/security-and-travel-information/') {
    return posts;
  }

  const title = $(elements).find('header>h1').text().trim();
  const date = data[0];
  const articleText = $(elements)
    .find('.entry-content *:not(h3,strong,p:contains(Location:))')
    .text()
    .replace(/\n+/g, '')
    .trim()
    .substr(0, 1000);
  const location = $(elements).find('p:contains(Location:)').text().replace('Location:', '')
    .trim();
  const timestamp = moment(date, 'DD MMMM, YYYY').unix();
  const domainUrl = 'https://fr.usembassy.gov/';

  const travelInfo = `${date} - ${title} - ${articleText}`;
  const extraDataInfo = {
    Date: date,
    Title: title,
    Location: location,
    URL: url,
    Domain: domainUrl,
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
  'US Embassy FR Alerts',
  'https://fr.usembassy.gov/u-s-citizen-services/security-and-travel-information/',
  [
    {
      selector: ['.mo-page-content ul li'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
