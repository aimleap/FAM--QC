import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://ico.org.uk';
const baseURLSuffix = '/action-weve-taken/enforcement/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const text = $(el).find('p.text-small').text();
    const date = text.split(',')[0].trim();
    if (moment(date, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('a.itemlink-content').attr('href');
      const headline = $(el).find('h3').text();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const companyNameQuery = 'h1';
  const dateQuery = 'dt:contains(Date)+dd';
  const typeQuery = 'dt:contains(Type)+dd';
  const sectorQuery = 'dt:contains(Sector)+dd';
  const articleFullTextQuery = '.article-content';
  const date = fetchText(dateQuery, $, elements);
  const companyName = fetchText(companyNameQuery, $, elements);
  const type = fetchText(typeQuery, $, elements);
  const sector = fetchText(sectorQuery, $, elements);
  const articleText = fetchText(articleFullTextQuery, $, elements);
  const summaryParagraph = `Type ${type}; Sector ${sector}; ${articleText}`;
  const timestamp = moment(date, 'DD MMMM YYYY').unix();
  const enforcementActionInfo = `${companyName}; ${date}; ${summaryParagraph}`;
  const extraDataInfo = {
    'Company Name': companyName, Date: date, 'Summary Paragraph': summaryParagraph,
  };
  posts.push(
    new Post({
      text: enforcementActionInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('UK Information Commissioners Office', baseURLPrefix, [
  {
    selector: ['.resultlist .itemlink'],
    parser: threadHandler,
  },
  {
    selector: ['#startcontent article'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
