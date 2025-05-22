import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.cz.de';
const baseURLSuffix = '/celle';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('de');
  elements.forEach((el) => {
    const newsDate = $(el).find('.content-overview-wrapper .news-date').text().trim();
    const newsTime = $(el).find('.content-overview-wrapper .news-time').text().trim();
    const publishedDate = `${newsDate} ${newsTime}`;
    if (moment(publishedDate, ['DD. MMM. YYYY hh:mm a', 'hh:mm a']).isSame(moment(), 'day')) {
      const href = $(el).find('a').attr('href');
      const headline = $(el).find('.news-headline').text().trim();
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
  moment.locale('de');
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const titleQuery = 'h1.node__title.title';
  const dateQuery = '.content-bottom-inner-left.desktop-view .author-time-wrapper li:not(li:has(span.refresh-time, .author-profile-wrapper))';
  const descriptionQuery = '.intro-text-wrapper';
  const articleFullTextQuery = '.container.text-formatted, .paragraph.paragraph--type--text, .paragraph.paragraph--type--list-content';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const formattedDate = moment(date, ['hh:mm a', 'DD. MMM. YYYY | hh:mm a']).format(
    'MM/DD/YYYY hh:mm a',
  );
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, ['hh:mm a', 'DD. MMM. YYYY | hh:mm a']).unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    date: formattedDate,
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
  return posts;
}

export const parser = new LiteParser(
  'Cellesche Zeitung',
  baseURLPrefix,
  [
    {
      selector: [
        'article.node--type-default-story.node--view-mode-hero-vertical, article.node--type-default-story.node--view-mode-teaser-horizontal',
      ],
      parser: threadHandler,
    },
    {
      selector: ['#content section.section .content>article>.node__content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
