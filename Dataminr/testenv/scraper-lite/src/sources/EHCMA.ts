import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'http://www.incident-reporter.net/e-NotifyCaerFeed/CaerMessageLive.html';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const h5Array: string[] = [];
  const index = [];
  const postData = [];
  let body = '';
  elements.forEach((el) => {
    const $el = $(el);
    const h5 = $el.text();
    if ($el.toString().includes('<body>')) {
      body = $el.toString();
    }
    if (!$el.toString().includes('<body>')) {
      h5Array.push(h5);
    }
  });
  let temp = '';
  for (let i = 0; i < h5Array.length; i++) {
    const abc = body.indexOf(h5Array[i]) - 4;
    index.push(abc);
  }
  for (let i = 0; i < index.length; i++) {
    temp = body.slice(index[i], index[i + 1]);
    postData.push(temp);
  }
  for (let i = 0; i < postData.length; i++) {
    const location = h5Array[i].split(',')[0];
    const seperateData = postData[i].split('<br><br>');
    for (let j = 0; j < seperateData.length - 1; j++) {
      if (seperateData[j] !== '') {
        let dateTimeExtraText: string[] = [];
        if (seperateData[j].includes('</h5>')) {
          const removeh5 = seperateData[j].split('</h5>')[1];
          dateTimeExtraText = removeh5.split('Posted On - ');
        } else {
          dateTimeExtraText = seperateData[j].split('Posted On - ');
        }
        const dateText = dateTimeExtraText[1];
        const dateTimeText = dateText.split('<br>')[0];
        const date = dateTimeText.split(' ')[0];
        const time = `${dateTimeText.split(' ')[1]} ${dateTimeText.split(' ')[2]}`;
        const messageType = dateTimeText.split('-')[1];
        const text = seperateData[j].split('<br>')[1].replace(/\n+/g, '');
        const textInfo = `${location} - ${date} - ${time} - ${messageType} - ${text}`;
        const timestamp = moment(date, 'l').unix();
        const extraDataInfo = {
          Location: location,
          Date: date,
          Time: time,
          'Message Type': messageType,
          'Message Text': text,
        };
        posts.push(
          new Post({
            text: textInfo,
            postUrl: url,
            postedAt: timestamp,
            extraData: extraDataInfo,
          }),
        );
      }
    }
  }
  return posts;
}

export const parser = new LiteParser('ECHMA', baseURL, [
  {
    selector: ['h5 , body'],
    parser: postHandler,
  },
]);
