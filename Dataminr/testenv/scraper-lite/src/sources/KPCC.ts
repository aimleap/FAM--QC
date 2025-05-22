import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $(el).find('a').attr('href');
    if (typeof link !== 'undefined' && (link.includes(yesterday) || link.includes(today))) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('.PromoLink-timestamp').attr('data-timestamp');
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function leftSideThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const leftSideThreads: Thread[] = [];

  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');
  elements.forEach((el) => {
    const $el = $(el);
    const link = $(el).find('a').attr('href');
    if (typeof link !== 'undefined' && (link.includes(yesterday) || link.includes(today))) {
      const href = $el.find('a').attr('href');
      const headline = $el.find('.PromoAudioEpisodeC-timestamp').attr('data-date');
      leftSideThreads.push({
        link: href,
        title: headline,
        parserName: 'leftSidePosts',
      });
    }
  });
  return leftSideThreads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  const $el = $(elements);
  if (url === 'https://www.kpcc.org/') {
    return posts;
  }
  const articleTitle = $el.find('h1.ArticlePage-headline').text().trim();
  const articlePublishedTime = $el
    .find('.ArticlePage-datePublished')
    .text()
    .replace(/\n+/g, '')
    .replace('Published', '')
    .trim();
  const articlePublishedDate = parseInt(data[0], 10);
  const articleText = $el
    .find('.ArticlePage-articleBody')
    .text()
    .replace(/\n+/g, '')
    .replace(/\t+/g, '')
    .trim();
  const timestamp = Math.ceil(articlePublishedDate / 1000);
  const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
  const extraDataInfo = {
    Article_Title: articleTitle,
    Date: articlePublishedTime,
    Article_Text: articleText,
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

async function leftSidePostHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const leftSidePosts: Post[] = [];
  const h2Tags: string[] = [];
  if (url === 'https://www.kpcc.org/') {
    return leftSidePosts;
  }

  elements.forEach((el) => {
    const h2Text = $(el).text();
    h2Tags.push(h2Text);
  });

  for (let i = 0; i < h2Tags.length; i++) {
    const articleTitle = h2Tags[i];
    const text = $(`h2:contains(${h2Tags[i]})`).nextUntil(`h2:contains(${h2Tags[i + 1]})`);
    const articleText = $(text).text().trim().replace(/\n+/g, '')
      .replace(/\t+/g, '');
    const articlePublishedTime = data[0];

    const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
    const extraDataInfo = {
      Article_Title: articleTitle,
      Date: articlePublishedTime,
      Article_Text: articleText,
    };
    leftSidePosts.push(
      new Post({
        text: articleInfo,
        postUrl: url,
        extraData: extraDataInfo,
      }),
    );
  }
  return leftSidePosts;
}

export const parser = new LiteParser('KPCC', 'https://www.kpcc.org/', [
  {
    selector: ['ol li'],
    parser: threadHandler,
  },
  {
    selector: ['ul li'],
    parser: leftSideThreadHandler,
  },
  {
    selector: ['.PodcastEpisodePage-articleBody h2'],
    parser: leftSidePostHandler,
    name: 'leftSidePosts',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
