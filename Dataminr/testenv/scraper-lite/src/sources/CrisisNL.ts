import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrlPrefix = 'https://crisis.nl';
const baseUrlSuffix = '/nl-alert/nl-alerts/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const dateTime = $(el).find('h3').text().trim();
    const description = $(el).find('p.results').text().replace(/\n+/g, '')
      .trim();
    const href = baseUrlPrefix + $(el).find('a').attr('href');
    const date = moment(dateTime, 'D-M-YYYY hh:mm:ss').format('MM/DD/YYYY');
    const timestamp = moment(dateTime, 'D-M-YYYY hh:mm:ss').unix();
    const alertsInfo = `${dateTime}; ${description}`;
    const extraDataText = {
      Hyperlink: href, Date: date,
    };
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: alertsInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Crisis NL', baseUrlPrefix, [
  {
    selector: ['.article .common.results'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
