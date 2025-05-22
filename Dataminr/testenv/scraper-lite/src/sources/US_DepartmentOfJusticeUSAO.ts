import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.justice.gov';
const baseUrlSuffix = '/usao/pressreleases?keys=&items_per_page=50';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 0; index < 3; index++) {
    preThreads.push({
      link: `${appendLink(baseUrlPrefix, baseUrlSuffix)}&page=${index}`,
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
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return threads;
  }
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

function extractText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
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
  const topicsQuery = '.field__label:contains(Topic(s):)+div.field__items>.field__item';
  const componentsQuery = '.field__label:contains(Component(s):)+div.field__items>.field__item';
  const fullTextQuery = 'div.field--name-field-pr-body';
  const locationTextQuery = 'div.field--name-field-pr-body p:eq(0)';
  const districtQuery = 'div.pr-header>.agency:eq(1)';

  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'dddd, MMMM DD, YYYY').format('MM/DD/YY');
  if (moment(date, 'MM/DD/YY').isSame(moment(), 'day')) {
    const postTitle = fetchText(titleQuery, $, elements);
    const district = fetchText(districtQuery, $, elements);
    const source = `US Attorney's Office for the ${district}`;
    const topics = extractText(topicsQuery, $, elements);
    const components = extractText(componentsQuery, $, elements);
    const fullText = fetchText(fullTextQuery, $, elements);
    const locationInfo = fetchText(locationTextQuery, $, elements);
    /* eslint-disable no-useless-escape */
    let location = locationInfo.split(/[\–\—\-]/)[0].trim();
    if (location.length > 20) location = district;
    const timestamp = moment(date, 'MM/DD/YY').unix();

    const newsInfo = `Title: ${postTitle}, Date: ${date}, Source: ${source}, Type: ${topics}, Location: ${location}`;
    const additionalData = `${components}; ${fullText}`;
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

export const parser = new LiteParser('US Department of Justice - USAO ', baseUrlPrefix, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['.view-content .views-row'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body article'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
