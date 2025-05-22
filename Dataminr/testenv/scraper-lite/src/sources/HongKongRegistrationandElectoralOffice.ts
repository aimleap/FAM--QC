import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    threads.push({
      link: $el.attr('href'),
      title: $el.text().trim(),
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
  elements.forEach((el) => {
    const $el = $(el);
    const datePosted = moment(
      data[0].substring(data[0].length - 11, data[0].length - 1),
      'DD.MM.YYYY',
    );
    if (!datePosted.isSame(moment(), 'day')) return;
    posts.push(
      new Post({
        text: `Text: ${data[0]} ; URL: ${url}; Content: ${$el
          .text()
          .trim()
          .substring(0, 1000)
          .replace(/\t+/g, '')
          .replace(/\n+/g, '')}  Publication Date: ${datePosted.format('MM/DD/YYYY')};`,
        postUrl: url,
        postedAt: moment(datePosted).unix(),
        extraData: {
          Text: $el.text().trim().substring(0, 1000).replace(/\t+/g, '')
            .replace(/\n+/g, ''),
          URL: url,
          'Publication Date': datePosted.format('MM/DD/YYYY'),
        },
      }),
    );
  });

  return posts;
}

export const parser = new LiteParser(
  'HongKongRegistrationandElectoralOffice',
  '',
  [
    {
      selector: ['#content-zone > div.main-text-zone > ul >li > a'],
      parser: threadHandler,
    },
    {
      selector: ['#pressrelease'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'https://www.elections.gov.hk/legco2021/eng/press.html',
);
