import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.tagblatt.de';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).find('.article-heading a, .DocumentRankingContentHolder>a').attr('href');
    const headline = $(el).find('.article-heading a, .DocumentRankingContentHolder>a').text();
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
  const titleQuery = 'header h1';
  const dateQuery = '.artikelhead span:not(span.pull-right)';
  const descriptionQuery = 'p.intro';
  const articleFullTextQuery = '.StoryShowBody .StoryShowBaseTextBox';
  const title = fetchText(titleQuery, $, elements);
  const date = fetchText(dateQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(date, 'DD.MM.YYYY').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    date,
    description,
    articleFullText,
    ingestpurpose: 'mdsbackup',
  };
  if (moment(date, 'DD.MM.YYYY').isSame(moment(), 'day')) {
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

export const parser = new LiteParser('Schwabisches Tagblatt', baseURL, [
  {
    selector: ['article.StoryPreviewBox, .DocumentRankingTab'],
    parser: threadHandler,
  },
  {
    selector: ['article.WebStoryShow'],
    parser: postHandler,
    name: 'post',
  },
]);
