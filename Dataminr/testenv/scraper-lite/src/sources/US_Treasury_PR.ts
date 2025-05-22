import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'h3', 'h3 a').map((t) => ({
    ...t,
    parserName: 'post',
  }));
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
      const headLine = $el.find('h2').text().replace(/\n+/g, '').replace(/\t+/g, '');
      const rawTime = $el.find('div.content div.date-format time').attr('datetime');
      const bodyOfPost = $el
        .find('.content>div.field--name-field-news-body')
        .text()
        .replace(/\n+/g, '')
        .replace(/\t+/g, '')
        .trim();

      if (rawTime === undefined) return;

      const date = moment(rawTime);

      posts.push(
        new Post({
          text: `Head Line: ${headLine}, Date: ${date.format(
            'MM/DD/YYYY',
          )}, Body Of Post: ${bodyOfPost}`,
          postUrl: url,
          postedAt: date.unix(),
          extraData: {
            Head_Line: headLine,
            Date: date.format('MM/DD/YYYY'),
            Body_Of_Post: bodyOfPost,
          },
        }),
      );

      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  return posts;
}

export const parser = new LiteParser(
  'US Treasury press releases',
  'https://home.treasury.gov/',
  [
    {
      selector: ['div.content--2col__body div'],
      parser: threadHandler,
    },
    {
      selector: ['div.region-content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'news/press-releases',
);
