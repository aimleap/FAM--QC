import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://www.floridahealth.gov';
const baseURLSuffix = '/environmental-health/drinking-water/boil-water-notices/';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('td:eq(2)').text().trim();
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const county = $el.find('td:eq(0)').text();
      const systemName = $el.find('td:eq(1)').text().replace(/\n+/g, '').replace(/\t+/g, '')
        .trim();
      let dateRescinded = $el.find('td:eq(3)').text();
      if (dateRescinded === '') {
        dateRescinded = 'Ongoing';
      }

      const timestamp = moment(date, 'MM/DD/YYYY').unix();
      const textInfo = `County: ${county} County Florida , System Name: ${systemName}, Date Issued: ${date}, Date Rescinded: ${dateRescinded}`;
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

export const parser = new LiteParser(
  'Florida Health Boil Water',
  baseURLPrefix,
  [
    {
      selector: ['block table tbody tr'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
