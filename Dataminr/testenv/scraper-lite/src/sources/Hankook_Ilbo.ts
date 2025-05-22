import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://www.hankookilbo.com';

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = 'https://www.hankookilbo.com/api/section/bottom-articles?sortType=recent&sectionCd=POLITICS&page=1&searchTxt=';
  const link2 = 'https://www.hankookilbo.com/api/section/bottom-articles?sortType=recent&sectionCd=SOCIETY&page=1&searchTxt=';
  const link3 = 'https://www.hankookilbo.com/api/section/bottom-articles?sortType=recent&sectionCd=ECONOMY&page=1&searchTxt=';
  const urls = [link1, link2, link3];
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
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return [];
  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.list;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.articleDeployDt;
    const dateText = date.split('T')[0];
    if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const title = jObj.articleTitle;
      const text = jObj.articleFrontPanContents;
      const id = jObj.articleId;
      const Url = `https://www.hankookilbo.com/News/Read/${id}`;
      const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
      const textInfo = title;
      const extraDataInfo = {
        text,
      };
      posts.push(
        new Post({
          text: textInfo,
          postUrl: Url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Hankook Ilbo',
  baseURL,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
