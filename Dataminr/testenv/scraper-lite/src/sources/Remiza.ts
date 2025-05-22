import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://remiza.com.pl';
const baseURLSuffix = '/category/kraj/';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.jeg_post_title a').attr('href');
    const headline = $(el).find('.jeg_post_title').text().trim();
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
  moment.locale('pl');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const dateQuery = '.jeg_meta_date';
  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'LL').format('MM/DD/YYYY');

  if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
    const titleQuery = 'h1.jeg_post_title';
    const authorQuery = '.jeg_meta_author a';
    const descriptionQuery = '.entry-content .content-inner p strong';
    const articleFullTextQuery = '.entry-content .content-inner p';

    const title = fetchText(titleQuery, $, elements);
    const author = fetchText(authorQuery, $, elements);
    const description = fetchText(descriptionQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'MM/DD/YYYY').unix();
    const articleInfo = `${title}; ${author}; ${date}; ${description}`;
    const extraDataInfo = {
      title,
      author,
      date,
      description,
      articleFullText,
      ingestpurpose: 'mdsbackup',
    };
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

export const parser = new LiteParser(
  'Remiza',
  baseURLPrefix,
  [
    {
      selector: ['.jeg_section article.jeg_post:not(.jeg_pl_sm, .jeg_pl_md_box)'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
