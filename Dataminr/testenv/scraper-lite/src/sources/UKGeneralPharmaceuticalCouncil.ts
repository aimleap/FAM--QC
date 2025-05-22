import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://inspections.pharmacyregulation.org/inspection-reports/listing';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const name = $(el).find('td:eq(0)').text().trim();
    const currentAddress = $(el).find('td:eq(1)').text().trim();
    const inspectionDate = $(el).find('td:eq(2)').text().trim();
    const metNotAllMet = $(el).find('td:eq(3)').text().trim();
    const GPhCregNo = $(el).find('td:eq(4)').text().trim();
    const timestamp = moment(inspectionDate, 'DD MMMM YYYY').unix();
    const inspectionReportsInfo = `${name}; ${currentAddress}; ${inspectionDate}; ${metNotAllMet}; ${GPhCregNo}`;
    const extraDataText = {
      Name: name, 'Current Address': currentAddress, 'Inspection Date': inspectionDate, 'Met/Not All Met': metNotAllMet, 'GPhC reg No': GPhCregNo,
    };
    if (moment(inspectionDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: inspectionReportsInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('UKGeneralPharmaceuticalCouncil', baseURL, [
  {
    selector: ['.table.inspection-listing tbody tr'],
    parser: postHandler,
    name: 'post',
  },
]);
