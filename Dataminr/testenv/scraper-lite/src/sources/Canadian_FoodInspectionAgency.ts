import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://recalls-rappels.canada.ca';
const baseURLSuffix = '/en';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $(el).find('.ar-type').text().split('|')[1].trim();
    if (moment(date, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const href = $el.find('.homepage-recent a').attr('href');
      const headline = $el.find('.homepage-recent a').text();
      threads.push({
        link: href,
        title: `${headline}~${date}`,
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const typeOfAlertQuery = '.region-header .h3';
  const titleQuery = '.gc-thickline span';
  const lastUpdatedDateQuery = '.field--name-field-last-updated time';
  const productQuery = '.field--item.field--name-field-product';
  const issueQuery = '.field--name-field-issue-type .field--item';
  const whatToDoQuery = '.field--name-field-action.field--item';

  const typeOfAlert = fetchText(typeOfAlertQuery, $, elements);
  const title = fetchText(titleQuery, $, elements);
  const lastUpdatedDate = fetchText(lastUpdatedDateQuery, $, elements);
  const product = fetchText(productQuery, $, elements);
  const issue = fetchText(issueQuery, $, elements);
  const whatToDo = fetchText(whatToDoQuery, $, elements);
  const date = data[0].split('~')[1];

  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const textInfo = `${typeOfAlert} ; ${title} ; Last Updated: ${lastUpdatedDate} ; Product: ${product} ; Issue: ${issue} ; What to do: ${whatToDo}`;

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Canadian Food Inspection Agency',
  baseURLPrefix,
  [
    {
      selector: ['.homepage-recent-row'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
