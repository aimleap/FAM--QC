import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.fsis.usda.gov/recalls';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const dateStatus = $(el).find('.recall-teaser__date').text().trim();
    const date = dateStatus.split('-')[0].trim();
    const formattedDate = date.split(',')[1].trim();
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const title = $(el).find('h3.recall-teaser__title').text().trim();
      const companyName = $(el).find('.recall-teaser__establishment').text();
      const href = `https://www.fsis.usda.gov${$(el).find('h3.recall-teaser__title a').attr('href')}`;
      const status = dateStatus.split('-')[1].trim();
      const location = $(el).find('.recall-teaser__states').text().trim();
      const impactedProducts = $(el).find('.recall-teaser__products span').text();
      const timestamp = moment(formattedDate, 'MM/DD/YYYY').unix();
      const textInfo = ` Title: ${title}; Comapny Name: ${companyName}; Date: ${date}; Case Status: ${status}; Location: ${location}; Impacted Products: ${impactedProducts}`;
      posts.push(
        new Post({
          text: textInfo,
          postUrl: href,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('US Food Safety & Inspection Service', baseURL, [
  {
    selector: ['.view__content .view__row'],
    parser: postHandler,
  },
]);
