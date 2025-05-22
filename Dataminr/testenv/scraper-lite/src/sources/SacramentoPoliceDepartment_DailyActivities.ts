import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://apps.sacpd.org/Dailies/index.aspx';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const h4Tags: string[] = [];
  const h4Ele = $(elements).find('h4.text-center');
  for (let i = 0; i < h4Ele.length; i++) {
    const h4Text = $(h4Ele[i]).text();
    h4Tags.push(h4Text);
  }

  const date = $(elements).find('#nrDateIncident').text();
  for (let j = 0; j < h4Tags.length; j++) {
    const divTag = $(elements).find(`h4.text-center:contains(${h4Tags[j]})+div`);
    const commandArea = h4Tags[j];
    const releaseNumber = $(divTag).find('p.mb-1 strong').text();
    const eventType = $(divTag).find('p.mb-1>em').text();
    const location = $(divTag).find('p.mb-1').text().split(':')[1].split(' at ')[0].trim();
    const time = $(divTag).find('p.mb-1').text().split(':')[1].split(' at ')[1];
    const text = $(divTag).find('p:not(p.mb-1)').text();
    const timestamp = moment(date, 'dddd, MMMM DD, YYYY').unix();
    const dailyActivitiesInfo = `${commandArea} ; ${date} ; ${time} ; ${releaseNumber} ; ${location} ; ${eventType} ; ${text}`;
    const extraDataInfo = {
      'Command Area': commandArea,
      Date: date,
      Time: time,
      'Release Number': releaseNumber,
      Location: location,
      'Event Type': eventType,
      Text: text,
    };
    if (moment(date, 'dddd, MMMM DD, YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: dailyActivitiesInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  }
  return posts;
}

export const parser = new LiteParser('Sacramento Police Department Daily Activities', baseURL, [
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
