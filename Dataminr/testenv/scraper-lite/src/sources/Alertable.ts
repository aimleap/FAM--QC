import moment from 'moment';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://feeds.alertable.ca/mobile/v2/feed.json';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const jsonArray = JSON.parse(response.body).entries;
  jsonArray.forEach((jObj: any) => {
    const articlePublicationDate = moment(jObj.sent).utc().format('MM/DD/YYYY');
    if (moment(articlePublicationDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const location = jObj.coverage_en !== undefined ? `Parts Of ${jObj.coverage_en}` : jObj.area[0].name_en;
      const href = jObj.cap_link;
      const title = `${jObj.type_en}@${location}`;
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
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const alertJsonObject = JSON.parse(response.body).alert;
  const date = moment(alertJsonObject.sent).utc().format('MMM DD, YYYY hh:mm a');
  const type = data[0].split('@')[0];
  const location = data[0].split('@')[1];
  const dateInfo = `${type} ${date}`;
  const affectedAreaInfo: string[] = [];
  let title = '';
  let description = '';
  let source = '';
  const infoJsonArray = alertJsonObject.info;
  infoJsonArray.forEach((jObj: any) => {
    const { language } = jObj;
    if (language === 'en-CA') {
      title = jObj.event;
      source = jObj.senderName;
      if (description === '') {
        description = jObj.description.replace(/\n+/g, ' ').replace(/\t+/g, ' ').replace('###', '').trim();
      }
      const affectedAreaInfoArray = jObj.area;
      affectedAreaInfoArray.forEach((eachAreaObj: any) => {
        const affectedArea = eachAreaObj.areaDesc;
        affectedAreaInfo.push(affectedArea);
      });
    }
  });
  const alertJsonID = url.replace('.json', '').split('/')[5];
  const currentYear = moment().format('YYYY');
  const alertUrl = `https://alertable.ca/#/details/${currentYear}/${alertJsonID}`;
  const timestamp = moment(date, 'MMM DD, YYYY hh:mm a').unix();
  const alertInfo = `${title} ; ${location} ; ${dateInfo} ; ${source} ; ${description} ; ${affectedAreaInfo.toString()}`;
  const extraDataInfo = {
    title,
    location,
    date: dateInfo,
    description,
    'Affected Areas': affectedAreaInfo.toString(),
  };
  posts.push(
    new Post({
      text: alertInfo,
      postUrl: alertUrl,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Alertable', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
