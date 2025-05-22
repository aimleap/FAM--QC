import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((element) => {
    const $el = $(element);
    const postedDate = moment($el.find('> div.recent-posts-content > p > span:nth-child(3)').text().trim(), 'MMMM D, YYYY');
    if (!postedDate.isSame(moment(), 'day')) return;

    const postLink = $el.find('> div.recent-posts-content > h4 > a').attr('href');
    const postTitle = $el.find('> div.recent-posts-content > h4 > a').text();
    const date = moment(postedDate, 'MMMM D, YYYY').format('MM/DD/YYYY');
    const timestamp = moment(postedDate, 'MMMM D, YYYY').unix();
    const postInfo = `${postTitle}, ${date}, ${postLink}`;
    posts.push(
      new Post({
        text: postInfo,
        postUrl: url,
        postedAt: timestamp,
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'ER_NewZealand',
  'https://extinctionrebellion.nz',
  [
    {
      selector: ['article.post'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/latest/',
);
