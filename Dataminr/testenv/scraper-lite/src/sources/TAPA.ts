import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://database.tapa-global.org';
const baseURLSuffix = '/incident/index';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('td:eq(0)').text().trim();
    const incidentDate = moment(date, 'DD.MM.YYYY').format('MM/DD/YY');
    if (moment(incidentDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const incidentCategory = $el.find('td:eq(1)').text();
      const modusOperandi = $el.find('td:eq(2)').text();
      const city = $el.find('td:eq(6)').text();
      const country = $el.find('td:eq(7)').text();
      const locationType = $el.find('td:eq(4)').text();
      const productCategory = $el.find('td:eq(3)').text();
      const valueInEUR = $el.find('td:eq(5)').text();

      const timestamp = moment(incidentDate, 'MM/DD/YY').unix();
      const textInfo = `Date: ${incidentDate}, Incident Category: ${incidentCategory}, Modus Operandi: ${modusOperandi}, City: ${city}, Country: ${country}, Location Type: ${locationType}, Product Category: ${productCategory}, Value in EUR: ${valueInEUR}`;
      const extraDataInfo = {
        'Incident Date': incidentDate,
        'Incident Category': incidentCategory,
        'Modus Operandi': modusOperandi,
        City: city,
        Country: country,
        'Location Type': locationType,
        'Product Category': productCategory,
        'Value in EUR': valueInEUR,
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
  });
  return posts;
}

export const parser = new LiteParser(
  'TAPA',
  baseURLPrefix,
  [
    {
      selector: ['.incident-index .mt50 .card .detail-row'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
