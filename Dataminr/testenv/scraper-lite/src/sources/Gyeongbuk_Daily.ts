import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'http://www.kbmaeil.com';
const baseURLSuffix = '/news/articleList.html?box_idxno=&sc_multi_code=S1&view_type=sm';

async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  for (let index = 1; index <= 2; index++) {
    preThreads.push({
      link: `${baseURLPrefix}${baseURLSuffix}&page=${index}`,
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const today = moment();
  return elements
    .filter((el) => {
      const publishedDate = $(el).find('.byline em:contains(등록일)').text().split('등록일')[1]?.trim();
      const timestamp = moment(publishedDate, 'YYYY.MM.DD');
      return timestamp.format('YYYY.MM.DD') === today.format('YYYY.MM.DD');
    })
    .map((el) => ({
      link: $(el).find('h4.titles a').attr('href'),
      title: $(el).find('p.lead').text().trim(),
      parserName: 'post',
    }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return [];
  const $el = $(elements);
  const titleQuery = 'h3.heading';
  const articleTextQuery = '.article-veiw-body p';
  const title = fetchText(titleQuery, $, elements);
  const description = data[1];
  const articleText = fetchText(articleTextQuery, $, elements);
  const date = $el.find('.infomation li:contains(등록일)').text().split('등록일')[1].trim();
  const timestamp = moment(date, 'YYYY.MM.DD hh:mm').unix();
  const newsInfo = `${title}; ${description}`;
  const extraDataInfo = {
    articleText,
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
  'Gyeongbuk Daily',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: preThreadHandler,
    },
    {
      selector: ['#section-list ul li'],
      parser: threadHandler,
      name: 'threads',
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
