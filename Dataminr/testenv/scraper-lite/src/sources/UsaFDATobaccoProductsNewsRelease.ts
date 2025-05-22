import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { getThreadArray } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'a[href*=news-events]', 'a[href*=news-events]').map(
    (t) => ({
      ...t,
      parserName: 'post',
    }),
  );
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const date = $el
        .find('#block-entityviewcontent-4 > div > aside > ul > div > li > div > p > time')
        .text();
      const heading = $el.find('.content-title').text();
      const subHeading = $el.find('.article-subtitle').text();
      const textString = `${date}; ${heading}; ${subHeading}`;
      posts.push(
        new Post({
          text: textString,
          postUrl: url,
          postedAt: moment(date, 'MM/DD/YYYY').startOf('day').unix(),
          extraData: { Headline: heading, 'Sub-header': subHeading, Date: date },
        }),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new LiteParser(
  'UsaFDATobaccoProductsNewsRelease',
  'https://www.fda.gov/',
  [
    {
      selector: ['div[role=main] ul li'],
      parser: threadHandler,
    },
    {
      selector: ['.article'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/tobacco-products/ctp-newsroom',
);
