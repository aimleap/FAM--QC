import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.macaupostdaily.com/';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const today = moment();
  return elements
    .filter((el) => {
      const publishedDate = $(el).find('.time span').text().trim();
      const timestamp = moment(publishedDate, 'YYYY-MM-DD hh:mm');
      return timestamp.format('MM/DD/YYYY') === today.format('MM/DD/YYYY');
    })
    .map((el) => ({
      link: $(el).find('.text a').attr('href'),
      title: $(el).find('.text a').text().trim(),
      parserName: 'post',
    }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url === baseURL) return [];

  const discussionTitleQuery = 'h2';
  const dateQuery = '.info p em';
  const articleTextQuery = '.art_cont p';
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'YYYY-MM-DD hh:mm').format('MM/DD/YYYY hh:mm');
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY hh:mm').unix();
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

export const parser = new LiteParser(
  'Macau Post Daily',
  baseURL,
  [
    {
      selector: ['ul.new_list li'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  {
    strictSSL: false,
  },
);
