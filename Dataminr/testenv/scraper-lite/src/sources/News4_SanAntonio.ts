import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const domainUrl = 'https://news4sanantonio.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://news4sanantonio.com/api/rest/audience/more?section=news4sanantonio.com/news/local&limit=0&offset=0 '; // Local News
  const link2 = 'https://news4sanantonio.com/api/rest/audience/more?section=news4sanantonio.com/news/nation-world&limit=0&offset=0'; // Nation-world
  const link3 = 'https://news4sanantonio.com/api/rest/audience/more?section=news4sanantonio.com/sports&limit=0&offset=0'; // Sports
  const link4 = 'https://news4sanantonio.com/api/rest/audience/more?section=news4sanantonio.com/news/entertainment&limit=0&offset=0'; // Entertainment
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    preThreads.push({
      link: urls[i],
      parserName: 'threads',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  if (url === domainUrl) return threads;
  const jsonArray = JSON.parse(response.body).data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.publishedDate).format('MM/DD/YYYY hh:mm');
    if (moment(articlePublishedDate, 'MM/DD/YYYY hh:mm').isSame(moment(), 'day')) {
      const href = jObj.url;
      const { title } = jObj;
      threads.push({
        link: href,
        title,
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
  if (url === domainUrl) return posts;
  const tempScriptTagText = $(elements).find('script:contains(sinclairDigital.storyData =)').get()[0].children[0].data;
  const scriptTagText = tempScriptTagText.split('sinclairDigital.storyData =')[1].trim();
  const formattedScriptTagText = scriptTagText.split('sinclairDigital.pageData =')[0];
  const finalScript = `${formattedScriptTagText.split('};')[0]}}`;
  const jsonObject = JSON.parse(finalScript);
  const title = jsonObject.headline;
  const { publishedDateTime } = jsonObject;
  const formattedDate = moment(publishedDateTime).format('MM/DD/YYYY, hh:mm a');
  const articleFullText = $(jsonObject.richText.replaceAll('{&nbsp;}', '').replaceAll('{', '<').replaceAll('}', '>')).text();
  const timestamp = moment(formattedDate, 'MM/DD/YYYY, HH:mm a').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    date: formattedDate,
    ingestpurpose: 'mdsbackup',
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

export const parser = new LiteParser('News4 San Antonio', domainUrl, [
  {
    selector: ['*'],
    parser: preThreadHandler,
  },
  {
    selector: ['*'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
