import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('.article__details--headline a').attr('href');
    const title = $el.find('.article__details--headline a').text();
    threads.push({
      link: href,
      title,
      parserName: 'post',
    });
  });
  return threads;
}

function extractDate(dateText: any) {
  const date = dateText.replace('Published: ', '').replace('a.m.', '').replace('p.m.', '').trim();

  return date;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const yesterday = moment().subtract(1, 'day').format('MM/DD/YYYY');
  const rawTime = extractDate($(elements).find('.dateline__published').text());
  const publishedDate = moment(rawTime).format('MM/DD/YYYY');

  if (moment(publishedDate).isAfter(yesterday)) {
    const articleTitle = $(elements).find('.headline-basic__article').text().trim();
    const articlePublishedTime = $(elements).find('.dateline__published').text().trim();
    const articleText = $(elements).find('.article__story').text().trim();
    const timestamp = toUnixTimestamp(publishedDate);

    const articleInfo = `Title: ${articleTitle}, ${articlePublishedTime}, Article Text: ${articleText}`;
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
  }

  return posts;
}

export const parser = new LiteParser('Plain Dealer', 'https://www.cleveland.com/', [
  {
    selector: ['article'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
