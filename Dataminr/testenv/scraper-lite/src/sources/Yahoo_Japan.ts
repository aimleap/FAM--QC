import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://jobcatalog.yahoo.co.jp';

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = 'https://jobcatalog.yahoo.co.jp/company/1000001267/review/';
  const link2 = 'https://jobcatalog.yahoo.co.jp/company/1000002354/review/';
  const link3 = 'https://jobcatalog.yahoo.co.jp/company/1100000611/review/';
  const link4 = 'https://jobcatalog.yahoo.co.jp/company/1000003552/review/';
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    threads.push({
      link: urls[i],
      parserName: 'post',
    });
  }
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

  elements.forEach((el) => {
    const newsDate = $(el).find('time').text();
    if (moment(newsDate, 'YYYY/MM/DD').isSame(moment(), 'day')) {
      const rating = $(el).find('.Rating_rating__value__232Bk').text();
      const title = $(el).find('.UserReview_userReview__title__2KVVb a, .UserReviewMask_userReviewMask__title___W0Hs  a').text();
      const postTitle = $(el).find('.UserReview_userReview__titleLabel__3C0DP, .UserReviewMask_userReviewMask__titleLabel__3xMYe').text();
      const articleFullText = $(el).find('.UserReview_userReview__comment__2b0C8, .UserReviewMask_userReviewMask__comment__xmVlU').text().replace(/\n+/g, '')
        .replace(/\t+/g, '');
      const href = $(el).find('.UserReview_userReview__user__3w8lw a, .UserReviewMask_userReviewMask__user__15ar4 a').attr('href');
      const hrefFinal = baseURL + href;
      const timestamp = moment(newsDate, 'YYYY/MM/DD').unix();
      const articleInfo = `${title}, ${rating}, ${postTitle}, ${newsDate}, ${articleFullText}`;
      const extraDataInfo = {
        discussion_title: title,
        ingestType: 'INGEST_API',
        rating,
        postTitle,
        topicUrl: hrefFinal,
        postTime: newsDate,
        postText: articleFullText,
        ingestpurpose: 'mdsbackup',
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: hrefFinal,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Yahoo Japan',
  baseURL,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['.review_p-review__item__3a0To'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
