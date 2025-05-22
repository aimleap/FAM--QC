import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://mvr.gov.mk';
const baseUrlSuffix = '/vesti';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('mk');
  elements.forEach((el) => {
    const articlePublishedDate = $(el).find('a#post_date').text().replace('Објавена на', '')
      .trim();
    if (moment(articlePublishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a#catg_title').attr('href');
      const headline = $(el).find('a#catg_title').text().trim();
      threads.push({
        link: href,
        title: headline,
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
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) return posts;
  moment.locale('mk');
  const discussionTitleQuery = '#MainContent_lblNaslov';
  const dateQuery = '#MainContent_lblNadNaslov';
  const articleTextQuery = '#MainContent_litVest';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('Macedonia Police', baseUrlPrefix, [
  {
    selector: ['.singleleft_inner ul.ppost_nav li'],
    parser: threadHandler,
  },
  {
    selector: ['#MainContent_pnlVest'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
