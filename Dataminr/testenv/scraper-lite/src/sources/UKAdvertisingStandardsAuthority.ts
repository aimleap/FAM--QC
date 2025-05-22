import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.asa.org.uk/codes-and-rulings/rulings.html?q=&sort_order=recent&date_period=past_year&from_date=&to_date=#rulings';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('.meta-listing li.meta-listing-item:eq(2)').text().replace(/\n+/g, '')
      .replace(/\t+/g, '')
      .trim();
    const companyName = $(el).find('h4.heading').text().trim();
    const ruling = $(el).find('.meta-listing li.meta-listing-item:eq(0)').text().replace(/\n+/g, '')
      .replace(/\t+/g, '')
      .trim();
    const typeOfAdvertising = $(el).find('.meta-listing li.meta-listing-item:eq(1)').text().trim();
    const summaryText = $(el).find('p').text().trim();
    const timestamp = moment(date, 'DD MMMM YYYY').unix();
    const advertisingInfo = `${companyName}; ${ruling}; ${typeOfAdvertising}; ${date}; ${summaryText}`;
    const extraDataText = {
      'Company Name': companyName, Ruling: ruling, 'Type Of Advertising': typeOfAdvertising, date, 'Summary Text': summaryText,
    };
    if (moment(date, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: advertisingInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('UK Advertising Standards Authority', baseURL, [
  {
    selector: ['.main-content .toggle-tabs-panel #rulings ul li.icon-listing-item'],
    parser: postHandler,
    name: 'post',
  },
]);
