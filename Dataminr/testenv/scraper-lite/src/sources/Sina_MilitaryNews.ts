import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrlPrefix = 'http://api.slide.news.sina.com.cn';
const baseUrlSuffix = '/interface/api_album.php?activity_size=198_132&size=img&ch_id=8&page=1&num=16&jsoncallback=slideNewsSinaComCnCB&_=1653633799928';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body.replace('slideNewsSinaComCnCB(', '').replaceAll(')', '');
  const jsonObj = JSON.parse(responseText);
  const jsonArray = jsonObj.data;
  jsonArray.forEach((jObj: any) => {
    const newsDate = jObj.createtime;
    const newsDateText = newsDate.split(' ')[0];
    if (moment(newsDateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const title = jObj.name;
      const summary = jObj.short_intro;
      const postUrl = jObj.url;
      const timestamp = moment(newsDateText, 'YYYY-MM-DD').unix();
      const articleInfo = `${title} ; ${summary} ; ${newsDateText} ; ${postUrl}`;

      posts.push(
        new Post({
          text: articleInfo,
          postUrl,
          postedAt: timestamp,
        }),
      );
    }
  });

  return posts;
}

export const parser = new LiteParser(
  'Sina Military News',
  baseUrlPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseUrlSuffix,
);
