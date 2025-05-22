import moment from 'moment';
import request from 'request';
import fs from 'fs';
import Logger from '../lib/logger';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 0; index < 10; index++) {
    preThreads.push({
      link: `${url}?page=0%2C${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === 'https://www.fcc.gov/documents') {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const releaseDate = $(el).find('.edoc-details .released-date').text().split('-')[0].trim();
    if (moment(releaseDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('a').text();
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function getTextFromFile(link: string, file: any) {
  let finalText = '';
  await new Promise<void>((resolve, reject) => {
    request({
      uri: link,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
        'Cache-Control': 'max-age=0',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
      },
      gzip: true,
    })
      .pipe(file)
      .on('finish', () => {
        finalText = fs.readFileSync('text.txt', 'utf8');
        resolve();
      })
      .on('error', (error: any) => {
        reject(error);
      });
  }).catch((error) => {
    Logger.info(`Something happened: ${error}`);
  });
  const editedFinalText = finalText.replace(/\n+/g, '').replace(/\t+/g, ' ').replace(/\r+/g, ' ');
  fs.unlink('text.txt', (err: any) => {
    if (err) throw err;
    Logger.info('Text File Deleted');
  });
  return editedFinalText;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  if (url === 'https://www.fcc.gov/documents') {
    return posts;
  }
  const title = $el.find('h1.title').text().replace(/\n+/g, '').trim();
  const fullTitle = $el
    .find('.edocs li:contains(Full Title:)')
    .text()
    .replace(/\n+/g, '')
    .replace('Full Title:', '')
    .trim();
  const releaseDate = $el
    .find('.edocs li:contains(Released On:)')
    .text()
    .replace('Released On:', '')
    .trim();
  const source = 'US FCC Documents';
  const type = $el
    .find('.edocs li:contains(Bureau(s):)')
    .text()
    .replace(/\n+/g, '')
    .replace('Bureau(s):', '')
    .trim();
  const action = $el
    .find('.edocs li:contains(Document Type(s):)')
    .text()
    .replace(/\n+/g, '')
    .replace('Document Type(s):', '')
    .trim();
  const description = $el
    .find('.edocs li:contains(Description:)')
    .text()
    .replace(/\n+/g, '')
    .replace('Description:', '')
    .trim();
  const issuedDate = $el
    .find('.edocs li:contains(Issued On:)')
    .text()
    .replace(/\n+/g, '')
    .replace('Issued On:', '')
    .trim();
  const adoptedDate = $el
    .find('.edocs li:contains(Adopted On:)')
    .text()
    .replace(/\n+/g, '')
    .replace('Adopted On:', '')
    .trim();
  const tags = $el
    .find('.edocs li:contains(Tags:)')
    .text()
    .replace(/\n+/g, '')
    .replace('Tags:', '')
    .trim();
  const timestamp = moment(releaseDate, 'll').unix();
  const additionalData = `${description}; ${issuedDate}; ${adoptedDate}; ${tags}`;

  const link = $el.find('#content .attachment.txt').attr('href');
  const file = fs.createWriteStream('text.txt');
  const fileText = await getTextFromFile(link, file);

  const documentInfo = `Title: ${title}, Description: ${fullTitle}, Date: ${releaseDate}, Source: ${source}, Type: ${type}, Action: ${action}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    'File Text': fileText,
  };
  posts.push(
    new Post({
      text: documentInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}
export const parser = new LiteParser(
  'US FCC Documents',
  'https://www.fcc.gov',
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['.view-content .edoc-details'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['#page'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/documents',
);
