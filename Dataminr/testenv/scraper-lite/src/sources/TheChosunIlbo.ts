import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://www.chosun.com';
const baseURLSuffix = '/pf/api/v3/content/fetch/story-feed?query=%7B%22excludeContentTypes%22%3A%22gallery%2C%20video%22%2C%22expandRelated%22%3Atrue%2C%22includeContentTypes%22%3A%22story%22%2C%22includeSections%22%3A%22%2Fpolitics%2Fdiplomacy-defense%22%2C%22size%22%3A20%7D';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.content_elements;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.display_date;
    const formattedDate = articlePublishedDate.split('T')[0];
    const date = moment(formattedDate, 'YYYY-MM-DD').format('MM/DD/YYYY');
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = jObj.canonical_url;
      const headline = jObj.description.basic;
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const scriptTagText = $(elements).find('script[id="fusion-metadata"]').get()[0].children[0].data;
  const formattedScript = scriptTagText.split(';Fusion.globalContentConfig')[0];
  const finalScript = formattedScript.split('Fusion.globalContent=')[1];
  const jsonObject = JSON.parse(finalScript);
  const headline = jsonObject.headlines.basic;
  const dateText = jsonObject.display_date;
  const date = dateText.split('T')[0];
  let text = '';
  const jsonArray = jsonObject.content_elements;
  jsonArray.forEach((jObj: any) => {
    if (jObj.hasOwnProperty('content')) {
      const { content } = jObj;
      text = text.concat(' ', content);
    }
    return text;
  });
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const textInfo = `${headline}`;
  const extraDataInfo = {
    text,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('The Chosun Ilbo', baseURLPrefix, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
