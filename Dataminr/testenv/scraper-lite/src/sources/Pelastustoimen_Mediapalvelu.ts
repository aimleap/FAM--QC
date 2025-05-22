import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'http://www.peto-media.fi/?MdcaOrigin=https%3A%2F%2Fmcas-proxyweb.mcas.ms';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('td:eq(2)').text().trim();
    const formattedDate = date.split(' ')[0].trim();
    if (moment(formattedDate, 'DD.MM.YYYY').isSame(moment(), 'day')) {
      const tapahtumakunta = $(el).find('td:eq(0)').text().trim();
      const tapahtumalaji = $(el).find('td:eq(1)').text().trim();
      const timestamp = moment(date, 'DD.MM.YYYY hh:mm:ss').unix();
      const textInfo = ` Tapahtumakunta: ${tapahtumakunta}; Tapahtumalaji: ${tapahtumalaji}; Ilmoitusaika: ${date}`;

      posts.push(
        new Post({
          text: textInfo,
          postUrl: url,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Pelastustoimen Mediapalvelu', baseURL, [
  {
    selector: ['tbody#lista tr'],
    parser: postHandler,
  },
]);
