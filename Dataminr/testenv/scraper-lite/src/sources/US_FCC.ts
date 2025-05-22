import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseUrlPrefix = 'https://www.fcc.gov';
const baseUrlSuffix = '/auctions';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const releasedDate = $el.find('.released-date').text().split('-')[0].trim();
    if (moment(releasedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h3 a').attr('href');
      const title = $el.find('h3 a').text().trim();
      threads.push({
        link: href,
        title,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  let tempText = $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .trim();
  tempText = typeof tempText.split(':')[1] !== 'undefined' ? tempText.split(':')[1].trim() : tempText;
  return tempText;
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
  const titleQuery = '.page__title';
  const dateQuery = '#content li:contains(Released On:)';
  const typeQuery = '#content li:contains(Document Type(s):)';
  const fullTitleQuery = '#content li:contains(Full Title:)';
  const bureausQuery = '#content li:contains(Bureau(s):)';
  const descriptionQuery = '#content p:contains(Description:)';
  const daFccQuery = '#content li:contains(DA/FCC #:)';
  const docketRmQuery = '#content li:contains(Docket/RM:)';

  const postTitle = await fetchText(titleQuery, $, elements);
  const releasedOn = await fetchText(dateQuery, $, elements);
  const source = 'US FCC';
  const type = await fetchText(typeQuery, $, elements);
  const fullTitle = await fetchText(fullTitleQuery, $, elements);
  const bureaus = await fetchText(bureausQuery, $, elements);
  const description = await fetchText(descriptionQuery, $, elements);
  const daFccText = await fetchText(daFccQuery, $, elements);
  const docketRmText = await fetchText(docketRmQuery, $, elements);
  const timestamp = moment(releasedOn, 'll').unix();

  const orderInfo = `Title: ${postTitle}, Date: ${releasedOn}, Source: ${source}, Type: ${type}`;
  const additionalData = `${fullTitle}; ${bureaus}; ${description}; ${daFccText}; ${docketRmText}`;

  posts.push(
    new Post({
      text: orderInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: {
        'Additional Data': additionalData,
      },
    }),
  );
  return posts;
}

export const parser = new LiteParser('US FCC', baseUrlPrefix, [
  {
    selector: ['.view-content .views-row article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
