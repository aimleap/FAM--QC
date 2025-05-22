import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.kens5.com';
const baseURLSuffix = '/local';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).text().replace(/\n+/g, ' ').replace(/\t+/g, ' ')
      .trim();
    if (!href.includes('/news/politics/')) {
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
  const todaysDate = moment().format('MMMM DD, YYYY');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const $el = $(elements);
  const dateText = $el.find('.article__published').text()?.split('Published:')[1].trim();
  if (dateText.includes(todaysDate)) {
    const titleQuery = 'h1.article__headline';
    const subTitleQuery = '.article__summary';
    const articleFullTextQuery = '.article__body p';

    const title = fetchText(titleQuery, $, elements);
    const subTitle = fetchText(subTitleQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(todaysDate, 'MMMM DD, YYYY').unix();
    const articleInfo = `${title}, ${subTitle}`;
    const extraDataInfo = {
      title,
      subTitle,
      articleFullText,
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
  'KENS 5',
  baseURLPrefix,
  [
    {
      selector: ['.story__meta a, .grid__cell .headline-list__list .headline-list__item a, .story-list__item a.story-list__title-link, .grid__module-sizer .story-row__item a.story-row__title-link'],
      parser: threadHandler,
    },
    {
      selector: ['body .page'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
