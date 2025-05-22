import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.ksl.com';
const baseURLSuffix = '/news/utah';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.top_story_info a, h2 a').attr('href');
    const headline = $(el).find('.top_story_info a h1, h2 a').text().trim();
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const dateText = $el.find('.titleAndAuthor .author h4').text().split('Posted -')[1].trim();
  const dateFormatted = `${dateText.split('at')[0].trim()} ${dateText.split('at')[1].trim()}`;
  const date = moment(dateFormatted, 'MMM. DD,YYYY hh:mm a').format('MM/DD/YYYY hh:mm');

  if (moment(date, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
    const titleQuery = '.titleAndAuthor h1';
    const articleFullTextQuery = 'article#kslMainArticle > p';

    const title = fetchText(titleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(date, 'MM/DD/YYYY').unix();
    const articleInfo = `${title}`;
    const extraDataInfo = {
      title,
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
  'KSL',
  baseURLPrefix,
  [
    {
      selector: ['.queue .queue_story, .top_story'],
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
