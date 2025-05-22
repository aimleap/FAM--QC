import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.justice.gov';
const baseUrlSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.views-field-title a').attr('href');
    const title = $(el).find('.views-field-title a').text().trim();
    threads.push({
      link: href,
      title,
      parserName: 'post',
    });
  });
  return threads;
}

async function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .trim();
}

async function extractText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  const tempText: string[] = [];
  $(elements).find(`${cssSelector}`).each((_index, el) => {
    tempText.push($(el).text());
  });
  return tempText;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = 'h1#node-title,.node-title';
  const dateQuery = '.date-display-single';
  const typeQuery = '.field__label:contains(Component(s):)+div.field__items>.field__item:eq(0)';
  const topicsQuery = '.field__label:contains(Topic(s):)+div.field__items>.field__item';
  const componentsQuery = '.field__label:contains(Component(s):)+div.field__items>.field__item';
  const fullTextQuery = '.field--name-field-pr-body';

  const dateText = await fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd, MMMM DD, YYYY').format('MM/DD/YY');
  if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
    const postTitle = await fetchText(titleQuery, $, elements);
    const source = 'US Department of Justice';
    const type = await fetchText(typeQuery, $, elements);
    const topics = await extractText(topicsQuery, $, elements);
    const components = await extractText(componentsQuery, $, elements);
    const fullText = await fetchText(fullTextQuery, $, elements);
    const timestamp = moment(date, 'MM/DD/YY').unix();

    const newsInfo = `Title: ${postTitle}, Date: ${date}, Source: ${source}, Type: ${type}`;
    const additionalData = `${topics}; ${components}; ${fullText}`;
    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: {
          'Additional Data': additionalData,
        },
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('US Department of Justice', baseUrlPrefix, [
  {
    selector: ['.view-content .views-row'],
    parser: threadHandler,
  },
  {
    selector: ['body article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
