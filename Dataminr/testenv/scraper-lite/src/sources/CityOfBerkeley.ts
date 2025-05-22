import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://berkeleyca.gov';
const baseURLSuffix = '/community-recreation/news/all-news?field_post_type_target_id=281&field_topic_target_id=All';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const newsDate = $(el).find('time').text().trim()
      .replace(/\n+/g, '')
      .replace(/\t+/g, '');
    if (moment(newsDate, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h4.title a').attr('href');
      const headline = $el.find('h4.title a').text().replace(/\n+/g, '').replace(/\t+/g, '');
      threads.push({
        link: href,
        title: `${headline}~${newsDate}`,
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

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const headlineQuery = 'section h1';
  const descriptionQuery = '.field-item.lead';
  const dateQuery = '.field-name-field-post-date .field-item time';
  const textQuery = '.field-node--body .field-item';

  const headline = fetchText(headlineQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const text = fetchText(textQuery, $, elements);

  const timestamp = moment(date, 'MMMM DD, YYYY').unix();
  const textInfo = `${headline} ; ${description} ; ${date} ; ${text}`;

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'City of Berkeley',
  baseURLPrefix,
  [
    {
      selector: ['.news-item'],
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
