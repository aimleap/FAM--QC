import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.politie.be';
const baseURLSuffix = '/5998/nl/opsporingen/gezochte-personen';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.layout--card__title h2 a').attr('href');
    const headline = $(el).find('.layout--card__title h2').text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const articlePublishedDateQuery = '.field--name-field-requestor-date time.datetime';
  const titleQuery = 'h1 .field--name-title';
  const locationQuery = '.field--name-field-wanted-combined-cities .field--item';
  const dateQuery = '.field--name-field-wanted-date .field--item';
  const descriptionQuery = '.field--name-field-intro';
  const articleFullTextQuery = '.layout--detail-node__main_content .block-field-blocknodewantedfield-content';
  const articlePublishedDate = fetchText(articlePublishedDateQuery, $, elements);
  const title = fetchText(titleQuery, $, elements);
  const location = fetchText(locationQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(articlePublishedDate, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}; ${location}; ${date}; ${description}`;
  const extraDataInfo = {
    title,
    location,
    date,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
  };
  if (moment(articlePublishedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: articleInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('Dutch National Police Wanted Suspects', baseURLPrefix, [
  {
    selector: ['.region--content .views-element-container .view-content .item-list ul li'],
    parser: threadHandler,
  },
  {
    selector: ['article .layout.layout--detail-node'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
