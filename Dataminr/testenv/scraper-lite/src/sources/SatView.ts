import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';
import { toTabularSchema } from '../lib/schema';

const baseURL = 'https://www.satview.org/spacejunk.php';
async function tabularSchemaPostHandler(
  $: CheerioSelector,
): Promise<Post[]> {
  const headers = $('div>table>tbody tr.texto_cabeca td').get();
  const rows = $('div>table>tbody tr.texto_sat').get();
  const todayDate = moment().format('MM/DD/YYYY HH:mm');
  return rows.map((r) => {
    const columns = $(r).find('td').get();
    const postLink = `https://www.satview.org/${$(r).find('td>a').attr('href')}`;
    const extradata = {};
    headers.forEach((h, i) => {
      // @ts-ignore
      extradata[$(h).text().replace(/\n+/g, '').trim()] = $(columns[i]).text().replace(/\n+/g, '').trim();
    });
    return toTabularSchema({
      data: extradata,
      post_date: moment(todayDate, 'MM/DD/YYYY HH:mm').unix(),
      event_link: postLink,
    });
  });
}

export const parser = new LiteParser('SatView', baseURL, [
  {
    selector: ['div>table>tbody'],
    parser: tabularSchemaPostHandler,
    name: 'post',
  },
]);
