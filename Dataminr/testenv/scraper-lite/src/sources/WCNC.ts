import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.wcnc.com/';

const todaysDate = moment().format('MMMM DD, YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('a.story__link, a.headline-list__title, a.story-row__title-link').attr('href');
    const headline = $(el).find('a.story__link, a.headline-list__title, a.story-row__title-link').text().trim();
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
  if (url === baseURL) {
    return posts;
  }

  const $el = $(elements);
  const dateText = $el.find('.article__published').text().split('Published:')[1].trim();
  if (dateText.includes(todaysDate)) {
    const titleQuery = 'h1.article__headline';
    const articleFullTextQuery = '.article__body p';

    const title = fetchText(titleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'MMMM DD, YYYY').unix();
    const articleInfo = `north_carolina: ${title}`;
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
  'WCNC',
  baseURL,
  [
    {
      selector: ['.story .story__meta, .headline-list .headline-list__list .headline-list__item, .grid__module .story-row__list .story-row__item'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
