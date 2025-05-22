import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.police.be/5998/fr/avis-de-recherche/personnes-disparues';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const today = moment();
  const weekAgo = moment().subtract(7, 'days');
  elements.forEach((el) => {
    const temp = $(el).find('.field--name-field-wanted-date .field--item').text().trim();
    const missingDate = moment(temp, 'DD.MM.YYYY').format('MM/DD/YYYY');
    if (moment(missingDate, 'MM/DD/YYYY').isBetween(weekAgo, today)) {
      const missingPersonName = $(el).find('.layout--card__title h2').text().trim();
      const lieu = $(el).find('.field--name-field-wanted-combined-cities .field--item').text().trim();
      const date = $(el).find('.field--name-field-wanted-date .field--item').text().trim();
      const age = $(el).find('.field--name-field-wanted-age .field--item').text().trim();
      const timestamp = moment(date, 'DD.MM.YYYY').unix();
      const missingPersonInfo = `${missingPersonName}; Lieu: ${lieu}; Date: ${date}; Age: ${age}`;
      const extraDataText = {
        Date: date,
      };

      posts.push(
        new Post({
          text: missingPersonInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Belgian Police', baseURL, [
  {
    selector: ['.region--content .views-element-container .view-content .item-list ul li'],
    parser: postHandler,
  },
]);
