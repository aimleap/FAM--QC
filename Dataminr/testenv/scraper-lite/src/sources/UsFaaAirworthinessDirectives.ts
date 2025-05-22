import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((element) => {
    const $el = $(element);
    const publishedDate = $el.find('td:nth-child(1)').text().trim();
    const effDate = $el.find('td:nth-child(3)').text().trim();
    const title = $el.find('td:nth-child(4)').text().trim().replace(/\t+/g, '')
      .replace(/\n+/g, '');
    threads.push({
      link: $el.find('td:nth-child(2) > a').attr('href').trim(),
      title: `${publishedDate}~${title}~${effDate}`,
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
  elements.forEach((element) => {
    const $el = $(element);
    const publishedDate = data[0].split('~')[0];
    const title = data[0].split('~')[1];
    const entitySource = $el
      .text()
      .replace('Header Information', '')
      .split('PDF Copy')[0]
      .trim()
      .replace(/\t+/g, ' ')
      .replace(/\n+/g, ' ');
    const entityImpacted = title;
    const effDate = data[0].split('~')[2];
    posts.push(
      new Post({
        text: `Title: Airworthiness Directive; Description: ${title}; Date: ${publishedDate}; Entities (source): ${entitySource}; Entities (impacted): ${entityImpacted}; Type (customizable): Airworthiness Directive; Additional Data: ${entitySource}; ${effDate}`,
        postUrl: url,
        postedAt: moment(publishedDate, 'MM/DD/YYYY').unix(),
        extraData: {
          Title: 'Airworthiness Directive',
          Description: title,
          Date: publishedDate,
          'Entities (source)': entitySource,
          'Entities (impacted)': entityImpacted,
          'Type (customizable)': 'Airworthiness Directive',
          'Additional Data': `${entitySource}; ${effDate}`,
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'UsFaaAirworthinessDirectives',
  '',
  [
    {
      selector: ['table tbody tr'],
      parser: threadHandler,
    },
    {
      selector: ['#xSec2'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'https://www.faa.gov/regulations_policies/airworthiness_directives/',
);
