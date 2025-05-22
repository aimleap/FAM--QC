import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');

  elements.forEach((el) => {
    const $el = $(el);
    const updatedDate = $el.find('updated').text();
    if (
      typeof updatedDate !== 'undefined'
      && (updatedDate.includes(yesterday) || updatedDate.includes(today))
    ) {
      const idUrl = $el.find('id').text();
      const updated = $el.find('updated').text();
      const title = $el.find('title').text();
      const summary = $el.find('summary p').text();
      const timestamp = moment(updated).unix();

      const entryInfo = `Updated: ${updated}, Title: ${title}, Summary: ${summary}`;
      const extraDataInfo = { Updated: updated, Title: title, Summary: summary };

      posts.push(
        new Post({
          text: entryInfo,
          postUrl: idUrl,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'UK Government',
  'https://www.gov.uk/foreign-travel-advice.atom',
  [
    {
      selector: ['entry'],
      parser: postHandler,
    },
  ],
);
