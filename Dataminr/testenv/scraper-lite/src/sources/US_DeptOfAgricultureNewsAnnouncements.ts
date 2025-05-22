import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.aphis.usda.gov';
const baseUrlSuffix = '/aphis/newsroom/news/all-news-and-announcements';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('td:eq(0)').text();
    if (moment(publishedDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = $el.find('td>a').attr('href');
      const type = $el.find('td:eq(2)').text();
      const category = $el.find('td:eq(3)').text();
      threads.push({
        link: href,
        title: `${type}@${category}`,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .trim();
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = 'h1.contentTitle';
  const fullTextQuery = '.content-meta~p:not(p:contains(Contacts:))';
  const dateQuery = '.time-stamp';

  const title = await fetchText(titleQuery, $, elements);
  const fullText = await fetchText(fullTextQuery, $, elements);
  const dateText = await fetchText(dateQuery, $, elements);
  const date = moment(dateText.split(':')[1].trim(), 'll').format('MM/DD/YY');
  const source = 'US Department of Agriculture News & Announcements';
  const type = data[0].split('@')[0];
  const category = data[0].split('@')[1];
  const additionalData = `Category: ${category} ; ${fullText}`;
  const timestamp = moment(date, 'MM/DD/YY').unix();

  const newsInfo = `Title: ${title}, Date: ${date}, Type: ${type}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };

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

export const parser = new LiteParser('US Department of Agriculture News & Announcements', baseUrlPrefix, [
  {
    selector: ['#DataTable>tbody>tr'],
    parser: threadHandler,
  },
  {
    selector: ['.wpthemeControlBody'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
