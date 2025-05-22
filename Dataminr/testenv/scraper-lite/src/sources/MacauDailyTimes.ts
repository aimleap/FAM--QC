import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://macaudailytimes.com.mo/category/macau';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const today = moment();
  return elements
    .filter((el) => {
      const publishedDate = $(el).find('.meta-data>span:eq(1)').text().split('-')[0].trim();
      const timestamp = moment(publishedDate, 'dddd, MMMM DD, YYYY');
      return timestamp.format('MM/DD/YYYY') === today.format('MM/DD/YYYY');
    })
    .map((el) => ({
      link: $(el).find('h1 a').attr('href'),
      title: $(el).find('h1 a').text().trim(),
      parserName: 'post',
    }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === baseURL) return [];

  const discussionTitleQuery = 'h1.post-title';
  const dateQuery = '.meta-data>span:eq(1)';
  const articleTextQuery = '.entry p';
  $(elements).find('noscript').remove();
  const dateText = fetchText(dateQuery, $, elements).split('-')[0].trim();
  const date = moment(dateText, 'dddd, MMMM DD, YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };

  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export const parser = new LiteParser('Macau Daily Times', baseURL, [
  {
    selector: ['div.list-one-col div.blog-item'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
