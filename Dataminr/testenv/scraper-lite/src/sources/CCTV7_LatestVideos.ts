import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://api.cntv.cn';
const baseURLSuffix = '/newLanmu/getVideoListByColumnChannelId?serviceId=tvcctv&cid=CHAL1450953074552346&n=80&sort=desc&mode=1&fd=&cb=Callback';

const todayDate = moment().format('YYYY/MM/DD');

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body.replace('Callback(', '').replaceAll(');', '');
  const jsonObj = JSON.parse(responseText);
  const jsonArray = jsonObj.list;
  jsonArray.forEach((jObj: any) => {
    const newsDate = jObj.focus_date;
    const newsDateText = moment(newsDate.unix).format('MM/DD/YY');
    const { title } = jObj;
    const postUrl = jObj.url;
    const timestamp = newsDate;
    const articleInfo = `${title} ; ${newsDateText} ; ${postUrl}`;

    if (postUrl.includes(todayDate)) {
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
  'CCTV 7 Latest Videos',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
