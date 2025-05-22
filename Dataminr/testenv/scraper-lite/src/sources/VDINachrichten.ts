import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.vdi-nachrichten.com/';
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('de');
  elements.forEach((el) => {
    const date = $(el).find('.single-meta div>span.single-meta__element:eq(0)').text().trim();
    const tempDate = date.split(' ');
    const modifiedDate = `${tempDate[0]} ${tempDate[1]}. ${tempDate[2]}`; // Due to date converion/comparison  issue, adding '.'(dot) after month
    if (moment(modifiedDate, 'DD. MMM. YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('.teaser__headline a').attr('href');
      const headline = $(el).find('.teaser__headline a').text();
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
  if (url === baseURL) return posts;
  moment.locale('de');
  const titleQuery = 'h1.headline';
  const descriptionQuery = '.excerpt';
  const publishedDateQuery = '.single-meta span.single-meta__element:eq(1)';
  const articleTextQuery = 'article.single-content h2, article.single-content>p:not(p.excerpt)';
  const sectionQuery = '.single-meta span.single-meta__element--blue';
  const publishedDate = fetchText(publishedDateQuery, $, elements).trim();
  const tempDate = publishedDate.split(' ');
  const modifiedDate = `${tempDate[0]} ${tempDate[1]}. ${tempDate[2]}`;
  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const section = fetchText(sectionQuery, $, elements);
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(modifiedDate, 'DD. MMM. YYYY').unix();
  const newsInfo = `${title}; ${description}; ${articleText}`;
  const extraDataInfo = {
    Title: title,
    Description: description,
    Text: articleText,
    Date: modifiedDate,
    Section: section,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('VDI Nachrichten', baseURL, [
  {
    selector: [
      'article.teaser--headline-position-top, section.teasergroup--full-width article.teaser',
    ],
    parser: threadHandler,
  },
  {
    selector: ['article.single-content'],
    parser: postHandler,
    name: 'post',
  },
]);
