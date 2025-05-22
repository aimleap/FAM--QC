import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://weartv.com';
const baseURLSuffix = '/api/rest/audience/more?section=weartv.com/news/local&limit=0&offset=0';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
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
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) return posts;
  const scriptTagText = $(elements).find('script:contains(sinclairDigital.storyData =)').get()[0].children[0].data;
  const formattedScriptTagText = scriptTagText.split('sinclairDigital.pageData =')[1];
  const finalScript = `${formattedScriptTagText.split('};')[0]}}`;
  const jsonObject = JSON.parse(finalScript).story;
  const title = jsonObject.headline;
  const description = jsonObject.summary;
  const { publishedDateTime } = jsonObject;
  const formattedDate = moment(publishedDateTime).format('MM/DD/YYYY, hh:mm');
  const articleFullText = $(jsonObject.richText).text();
  const timestamp = moment(formattedDate, 'MM/DD/YYYY, hh:mm').unix();
  const articleInfo = `${title} ; ${description}`;
  const extraDataInfo = {
    title,
    description,
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

export const parser = new LiteParser('WEAR TV', baseURLPrefix, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
