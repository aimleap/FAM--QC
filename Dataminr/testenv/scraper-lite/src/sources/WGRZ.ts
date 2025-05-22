import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.wgrz.com/';

const todaysDate = moment().format('MMMM DD, YYYY');

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('h4.story-row__title a, a.headline-list__title, h4.story-list__title a').attr('href');
    const headline = $(el).find('h4.story-row__title a, a.headline-list__title, h4.story-list__title').text().trim();
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
  if (url === baseURL) return posts;
  const $el = $(elements);
  const dateText = $el.find('.article__published').text().split('Published:')[1].trim();
  if (dateText.includes(todaysDate)) {
    const titleQuery = 'h1.article__headline';
    const subTitleQuery = '.article__summary';
    const articleFullTextQuery = '.article__body p';

    const title = fetchText(titleQuery, $, elements);
    const subTitle = fetchText(subTitleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'MMMM DD, YYYY').unix();
    const articleInfo = `new_york: ${title}, ${subTitle}`;
    const extraDataInfo = {
      title,
      subTitle,
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
  'WGRZ',
  baseURL,
  [
    {
      selector: ['.grid__module-sizer .story-row__item, .headline-list__list .headline-list__item, .story-list__item:not(.story-list__item_ad_true)'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
