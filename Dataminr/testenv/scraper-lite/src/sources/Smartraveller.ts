import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.pop();
  elements.forEach((el) => {
    const $el = $(el);
    const dateUpdated = moment($el.find('td.views-field-field-updated time').attr('datetime'));
    if (!dateUpdated.isSame(moment(), 'day')) return;
    threads.push({
      link: $el.find('td.views-field-title a').attr('href'),
      parserName: 'post',
      title: dateUpdated.format('MM/DD/YYYY'),
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
    if (url.indexOf('https://www.smartraveller.gov.au/destinations/') === -1) return;
    const $el = $(el);
    const destination = $el.find('.layout-content-header h1').text().trim();
    const overallAdviceLevel = $el
      .find('.region-content-header .field-content strong')
      .text()
      .trim();
    const content = $el
      .find('.region-content-highlight .views-field-field-last-update')
      .text()
      .trim()
      .replace(/\t+/g, '')
      .replace(/\n+/g, '')
      + $el
        .find('.region-content-highlight .views-field-field-last-update-notes')
        .text()
        .trim()
        .replace(/\t+/g, '')
        .replace(/\n+/g, '');
    posts.push(
      new Post({
        text: `Destination: ${destination}; Overall Advice Level: ${overallAdviceLevel}; Description: ${content}; Updated: ${data[0]}`,
        postUrl: url,
        postedAt: moment(data[0], 'MM/DD/YYYY').unix(),
        extraData: {
          Destination: destination,
          'Overall Advice Level': overallAdviceLevel,
          Description: content,
          Updated: data[0],
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'Smartraveller',
  'https://www.smartraveller.gov.au/',
  [
    {
      selector: ['table > tbody > tr'],
      parser: threadHandler,
    },
    {
      selector: ['main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/destinations',
);
