import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://webapp3.sanantonio.gov/policecalls/Calls.aspx';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const incidentNumber = $(el).find('td:eq(1)').text().trim();
    const dateTime = $(el).find('td:eq(2)').text().trim();
    const problemType = $(el).find('td:eq(3)').text().trim();
    const address = $(el).find('td:eq(4)').text().trim();
    const division = $(el).find('td:eq(5)').text().trim();
    const timestamp = moment(dateTime, 'MM/DD/YYYY hh:mm:ss a').unix();
    const pressRealseInfo = `${incidentNumber} ; ${dateTime} ; ${problemType} ; ${address} ; ${division}`;
    const extraDataInfo = {
      'Incident Number': incidentNumber,
      'Date Time': dateTime,
      'Problem Type': problemType,
      Address: address,
      Division: division,
    };
    if (moment(dateTime, 'MM/DD/YYYY hh:mm:ss a').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: pressRealseInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('San Antonio Police Department', baseURL, [

  {
    selector: ['table#gvCalls>tbody>tr:not(:has(tbody, th))'],
    parser: postHandler,
  },
]);
