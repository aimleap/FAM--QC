import moment from 'moment';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const domainUrl = 'https://fox17.com/';
async function preThreadHandler(): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  const link1 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/news/local&limit=0&offset=0'; // Local News
  const link2 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/news/nation-world&limit=0&offset=0'; // Nation-world
  const link3 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/sports&limit=0&offset=0'; // Sports
  const link4 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/news/entertainment&limit=0&offset=0'; // Entertainment
  const link5 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/news/ferrier-files&limit=0&offset=0'; // FERRIER FILES
  const link6 = 'https://fox17.com/api/rest/audience/more?section=fox17.com/fox-17-investigates&limit=0&offset=0'; // FOX 17 INVESTIGATES
  const urls = [link1, link2, link3, link4, link5, link6];
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
  const scriptTagText = $(elements).find('script:contains(sinclairDigital.storyData =)').get()[0].children[0].data;
  const formattedScriptTagText = scriptTagText.split('sinclairDigital.pageData =')[1];
  const finalScript = `${formattedScriptTagText.split('};')[0]}}`;
  const jsonObject = JSON.parse(finalScript).story;
  const title = jsonObject.headline;
  const { publishedDateTime } = jsonObject;
  const formattedDate = moment(publishedDateTime).format('MM/DD/YYYY, hh:mm a');
  const articleFullText = $(jsonObject.richText).text();
  const timestamp = moment(formattedDate, 'MM/DD/YYYY, HH:mm a').unix();
  const articleInfo = `tennessee: ${title}`;
  const extraDataInfo = {
    title: `tennessee: ${title}`,
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

export const parser = new LiteParser('Fox 17', domainUrl, [
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
