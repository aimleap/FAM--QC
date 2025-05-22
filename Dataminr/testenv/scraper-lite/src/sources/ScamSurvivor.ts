import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const $el = $(elements[0]);
  const noOfPagesInThread = Math.ceil(
    Number(
      $el
        .text()
        .split('•')[0]
        .replace(/[^0-9.]/g, ''),
    ) / 25,
  );
  for (let index = 0; index < noOfPagesInThread; index++) {
    threads.push({
      link: `${url}&start=${index * 25}`,
      parserName: 'thread',
    });
  }
  return threads;
}

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  // removing first element as it is header
  elements.shift();
  elements.forEach((el) => {
    const $el = $(el);
    threads.push({
      link:
        $el.find('strong.pagination').length > 0
          ? $el
            .find('strong.pagination span a:nth-last-child(1)')
            .attr('href')
            .replace(/^.*\/\/[^/]+/, '')
          : $el
            .find('.topictitle')
            .attr('href')
            .replace(/^.*\/\/[^/]+/, ''),
      parserName: 'post',
      title: $el.find('dt a.topictitle').text().trim(),
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
  elements.forEach((el) => {
    const $el = $(el);
    $el.find('.post').each((index, row) => {
      const commentDate = moment(
        $(row).find('p.author').text().split(' ')
          .reverse()
          .slice(0, 6)
          .reverse()
          .join(' '),
        'lll',
      );
      if (moment().diff(commentDate, 'hours') <= 24) {
        const title = data[0];
        const date = commentDate.format('lll');
        const mainTextBody = $(row)
          .find('.content')
          .text()
          .trim()
          .replace(/\t+/g, '')
          .replace(/\n+/g, '');
        const commentText = `Title: ${title}; Date: ${date}; Main Text body: ${mainTextBody}`;
        posts.push(
          new Post({
            text: commentText,
            postUrl: url,
            postedAt: commentDate.unix(),
            extraData: { Title: title, Date: date, 'Main Text body': mainTextBody },
          }),
        );
      }
    });
  });
  return posts;
}

export const parser = new LiteParser(
  'ScamSurvivor',
  'https://www.scamsurvivors.com/forum/',
  [
    {
      selector: ['div.pagination'],
      parser: preThreadHandler,
    },
    {
      selector: ['dl.icon'],
      parser: threadHandler,
      name: 'thread',
    },
    {
      selector: ['#page-body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/search.php?st=1&sk=t&sd=d&sr=topics&search_id=active_topics',
);
