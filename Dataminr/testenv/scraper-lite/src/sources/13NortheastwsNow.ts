import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.13newsnow.com';
const baseURLSuffix = '/section/local';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('a.story-list__title-link, .story__meta a.story__link').attr('href');
    const headline = $(el).find('a.story-list__title-link, .story__meta a.story__link').text().trim();
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

  const date = $(elements).find('.article__published, .video__published').text().split('Published:')[1].trim();
  const formattedDate = `${date.split('EST')[0].trim()} ${date.split('EST')[1].trim()}`;
  if (moment(formattedDate, 'hh:mm a MMMM DD, YYYY').isSame(moment(), 'day')) {
    const titleQuery = 'h1.article__headline, h1.video__headline';
    const descriptionQuery = '.article__summary, .video__summary';
    const articleFullTextQuery = '.article__body p';

    const title = fetchText(titleQuery, $, elements);
    const description = fetchText(descriptionQuery, $, elements);
    const articleFullText = fetchText(articleFullTextQuery, $, elements);
    const timestamp = moment(formattedDate, 'hh:mm a MMMM DD, YYYY').unix();
    const articleInfo = `${title}; ${description}`;
    const extraDataInfo = {
      title,
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
  '13 Northeastws Now',
  baseURLPrefix,
  [
    {
      selector: ['.grid .grid__section .grid__content .story-list li, .grid .grid__section .grid__content .grid__cell .story'],
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
