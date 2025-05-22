import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://www.ukmto.org';
const baseURLSuffix = '/indian-ocean/recent-incidents';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const today = moment();
  const tomorrowDate = moment().add(1, 'day');
  elements.forEach((el) => {
    const $el = $(el);
    const date = $el.find('.details__small:contains(Date)').text().split('Date:')[1].trim();
    if (moment(date, 'Do MMMM YYYY').isBetween(today, tomorrowDate, 'day', '[]')) {
      const title = $el
        .find('h5.details__title')
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const location = $el
        .find('.details__small:contains(Location)')
        .text()
        .split('Location:')[1]
        .trim();
      const lat = location.split(',')[0].trim();
      const lon = location.split(',')[1].trim();
      const details = $el
        .find('p:not(.details__small)')
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const timestamp = moment(date, 'Do MMMM YYYY').unix();
      const textInfo = `title: ${title} ; date: ${date} ; latitude: ${lat} ; longitude: ${lon} ; details: ${details}`;
      const extraDataInfo = {
        title,
        date,
        lat,
        lon,
        details,
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
  'United Kingdom Maritime Trade Operations',
  baseURLPrefix,
  [
    {
      selector: ['.incidents-bar .details-clickable-panel'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
