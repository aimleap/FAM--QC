import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://sgonorte.bomberosperu.gob.pe/24horas';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const caseNumber = $(el).find('td:eq(0)').text().trim();
    const dateTime = $(el).find('td:eq(1)').text().replaceAll('.', '')
      .trim();
    const location = $(el).find('td:eq(2)').text().trim();
    const eventType = $(el).find('td:eq(3)').text().trim();
    const eventState = $(el).find('td:eq(4)').text().trim();
    const machines = $(el).find('td:eq(5)').text().replace(/\n+/g, '')
      .trim();
    const timestamp = moment(dateTime, 'DD/MM/YYYY hh:mm:ss a').unix();
    const emergencyServiceInfo = `${caseNumber} ; ${dateTime} ; ${location} ; ${eventType} ; ${eventState} ; ${machines}`;
    const extraDataInfo = {
      'Case Number': caseNumber,
      'Date Time': dateTime,
      Location: location,
      'Event Type': eventType,
      'Event State': eventState,
      Machines: machines,
    };
    if (moment(dateTime, 'DD/MM/YYYY hh:mm:ss a.').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: emergencyServiceInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Peruvian General Corps Of Volunteer Firefighters', baseURL, [
  {
    selector: ['table.table tbody tr'],
    parser: postHandler,
    name: 'post',
  },
]);
