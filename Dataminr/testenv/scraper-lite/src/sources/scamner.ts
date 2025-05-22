import LiteParser from '../lib/parsers/liteParser';
import { parseTimestamp } from '../lib/timestampUtil';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    if (
      $(el).find('a').text().includes('Latest analysed')
      || $(el).find('a').text().includes('Risky websites')
    ) {
      const href = $el.find('a').attr('href');
      const title = $el.find('a').text();
      threads.push({
        link: href,
        title,
        parserName: 'prePost',
      });
    }
  });
  return threads;
}

async function prePostHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('td>a').attr('href');
    const time = $el.find('td:contains(ago),td:contains(yesterday)').text();
    threads.push({
      link: href,
      title: time,
      parserName: 'post',
    });
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
  if (url === 'https://www.scamner.com/') {
    return posts;
  }

  const lastUpdated = data[1];
  const website = $el.find('.result_1 h2').text().trim();
  const title = $el.find('.result_2 li:contains(Title)').text().trim();
  const description = $el.find('.result_2 li:contains(Description)').text().trim();
  const timestamp = parseTimestamp(`${data[1]}`);

  const scamnerInfo = `Title: ${title} - Description: ${description}`;
  const extraDataInfo = {
    Last_Updated: lastUpdated,
    Website: website,
    Title: title,
    Description: description,
    ingestType: 'INGEST_API',
    receivedTimestamp: timestamp,
  };

  posts.push(
    new Post({
      text: scamnerInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );

  return posts;
}

export const parser = new LiteParser('Scamner', 'https://www.scamner.com/', [
  {
    selector: ['.container ul li'],
    parser: threadHandler,
  },
  {
    selector: ['.last_webs tbody tr'],
    parser: prePostHandler,
    name: 'prePost',
  },
  {
    selector: ['.global_container'],
    parser: postHandler,
    name: 'post',
  },
]);
