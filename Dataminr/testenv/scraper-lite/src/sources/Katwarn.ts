import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://warnungen.katwarn.de/';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const todaysDate = moment().format('DD.MM.YYYY');
  elements.forEach((el) => {
    const $el = $(el);
    const summary = $el.find('h3').text().trim();
    if (summary.includes(todaysDate)) {
      const header = $el.find('h2').text().trim();
      const text = $el.find('.detail_text').text()?.split('Hinweise:')[0].trim();
      const timestamp = moment(todaysDate, 'DD.MM.YYYY').unix();
      const textInfo = `${header} ; ${summary}`;
      const extraDataInfo = {
        header,
        text,
        Date: todaysDate,
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
  'Katwarn',
  baseURL,
  [
    {
      selector: ['.warning_detail'],
      parser: postHandler,
    },
  ],
);
