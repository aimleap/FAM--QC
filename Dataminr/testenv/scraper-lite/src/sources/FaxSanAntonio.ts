import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const yesterday = moment().subtract(1, 'day');
  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.publishedDate;
    if (moment(articlePublishedDate).isAfter(yesterday)) {
      const articleTitle = jObj.title;
      const articlePublishedTime = jObj.publishedDateISO8601;
      const articleText = jObj.summary;
      const articleUrl = `https://foxsanantonio.com${jObj.url}`;
      const timestamp = Math.ceil(jObj.publishedDate / 1000);
      const articleInfo = `Title: ${articleTitle}, Published: ${articlePublishedTime}, Article Text: ${articleText}`;
      const extraDataInfo = {
        Article_Title: articleTitle,
        Date: articlePublishedTime,
        Article_Text: articleText,
      };

      posts.push(
        new Post({
          text: articleInfo,
          postUrl: articleUrl,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });

  return posts;
}

export const parser = new LiteParser(
  'Fox29 San Antonio',
  'https://foxsanantonio.com/api/rest/audience/more?section=foxsanantonio.com/news/local&limit=50',
  [
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
