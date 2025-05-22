import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const releasedDate = $el.find('.released-date').text().split('-')[0].trim();
    if (moment(releasedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h3 a').attr('href');
      const title = $el.find('h3 a').text().trim();
      threads.push({
        link: href,
        title,
        parserName: 'postThreads',
      });
    }
  });
  return threads;
}

async function postThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const postThreads: Thread[] = [];

  if (url === 'https://www.fcc.gov/enforcement/orders') {
    return postThreads;
  }

  const $el = $(elements);
  const title = $el.find('.page__title').text().replace(/\n+/g, '').trim();
  const fullTitle = $el
    .find('#content li:contains(Full Title:)')
    .text()
    .replace('Full Title:', '')
    .trim();
  const dataInfo = $el.find('#content li:contains(Released On:)').text().replace(/\n+/g, '').trim();
  const releasedOn = dataInfo.split(':')[1].trim();
  const source = 'US FCC Orders';
  const type = $el.find('#content li:contains(Bureau(s):)').text().replace('Bureau(s):', '').trim();
  const action = $el
    .find('#content li:contains(Document Type(s):)')
    .text()
    .replace('Document Type(s):', '')
    .trim();
  const description = $el
    .find('#content p:contains(Description:)')
    .text()
    .replace('Description:', '')
    .trim();
  const adoptedOn = $el
    .find('#content li:contains(Adopted On:)')
    .text()
    .replace('Adopted On:', '')
    .trim();
  const issuedOn = $el
    .find('#content li:contains(Issued On:)')
    .text()
    .replace('Issued On:', '')
    .trim();
  const tags = $el
    .find('#content .field-label:contains(Tags:)+.field-items')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const txtLink = $el.find('#content .attachment.txt').attr('href');

  postThreads.push({
    link: txtLink,
    title: `${title}#${fullTitle}#${releasedOn}#${source}#${type}#${action}#${description}#${adoptedOn}#${issuedOn}#${tags}#${url}`,
    parserName: 'post',
  });
  return postThreads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === 'https://www.fcc.gov/enforcement/orders') {
    return posts;
  }

  const $el = $(elements);
  const textFileInfo = $el.text().replace(/\n+/g, '').trim();
  const dataInfo = typeof data[1] !== 'undefined' ? data[1].split('#') : '';
  const title = dataInfo[0];
  const fullTitle = dataInfo[1];
  const releasedOn = dataInfo[2];
  const source = dataInfo[3];
  const type = dataInfo[4];
  const action = dataInfo[5];
  const description = dataInfo[6];
  const adoptedOn = dataInfo[7];
  const issuedOn = dataInfo[8];
  const tags = dataInfo[9];
  const URL = dataInfo[10];

  const additionalData = `${description}; ${issuedOn}; ${adoptedOn}; ${tags}`;

  const orderInfo = `Title: ${title}, Description: ${fullTitle}, Date: ${releasedOn}, Source: ${source}, Type: ${type}, Action: ${action}, Additional Data: ${additionalData}`;

  posts.push(
    new Post({
      text: orderInfo,
      postUrl: URL,
      postedAt: moment(releasedOn, 'MMM DD, YYYY').startOf('day').unix(),
      extraData: {
        'Text File Info': textFileInfo,
      },
    }),
  );

  return posts;
}

export const parser = new LiteParser(
  'US FCC Orders',
  'https://www.fcc.gov',
  [
    {
      selector: ['.view-content .views-row article'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postThreadHandler,
      name: 'postThreads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/enforcement/orders',
);
