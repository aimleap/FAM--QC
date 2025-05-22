import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.consumerfinance.gov/enforcement/actions/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const dateFiled = $(el).find('.a-date span>time').text();
    const companyName = $(el).find('.o-post-preview_title').text().replace(/\n+/g, ' ')
      .trim();
    const description = $(el).find('.o-post-preview_description').text().replace(/\n+/g, ' ')
      .trim();
    const timestamp = moment(dateFiled, 'MMM DD, YYYY').unix();
    const enforcementActionsInfo = `${dateFiled}; ${companyName}; ${description}`;
    const extraDataText = {
      'Date Filed': dateFiled, 'Company Name': companyName, Description: description,
    };
    if (moment(dateFiled, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: enforcementActionsInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Consumer Financial Protection Bureau Enforcement', baseURL, [
  {
    selector: ['section article'],
    parser: postHandler,
    name: 'post',
  },
]);
