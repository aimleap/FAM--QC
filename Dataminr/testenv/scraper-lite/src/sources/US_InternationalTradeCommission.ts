import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.usitc.gov';
const baseUrlSuffix = '/news_releases';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('span.date-display-single').text().trim();
    if (moment(publishedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('.views-field-title a').attr('href');
      const headline = $(el).find('.views-field-title a').text().trim();
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .trim();
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseUrlPrefix + baseUrlSuffix) {
    return posts;
  }
  const titleSelector = 'h1.page-header';
  const dateSelctor = '.field-name-field-release-date';
  const additionalDataSelector = '.field-name-field-release-summary';

  const postTitle = fetchText(titleSelector, $, elements);
  const date = fetchText(dateSelctor, $, elements);
  const fullText = fetchText(additionalDataSelector, $, elements);
  const source = 'US International Trade Commission';
  const timestamp = moment(date, 'LL').unix();

  const newsInfo = `Title: ${postTitle}, Date: ${date}, Source: ${source}`;
  const extraDataInfo = { 'Additional Data': fullText };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('US International Trade Commission', baseUrlPrefix, [
  {
    selector: ['.view-content>.views-row'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
