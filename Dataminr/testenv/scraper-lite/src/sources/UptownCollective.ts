import moment from 'moment-timezone';
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
    const title = $el
      .find('div.post-header h2 a')
      .text()
      .trim()
      .replace(/\t+/g, '')
      .replace(/\n+/g, '');
    const datePosted = $el.find('div.post-header span.post-date span').text();
    const articleText = $el
      .find('div.post-entry')
      .text()
      .trim()
      .replace(/\t+/g, '')
      .replace(/\n+/g, '');
    posts.push(
      new Post({
        text: `${title}; Published: ${datePosted}; ${articleText}`,
        postUrl: url,
        postedAt: moment(datePosted, 'MMMM DD[,] YYYY').unix(),
        extraData: { Article_Title: title, Date: datePosted, Article_Text: articleText },
      }),
    );
  });

  return posts;
}

export const parser = new LiteParser('UptownCollective', 'https://www.uptowncollective.com/', [
  {
    selector: ['#main article'],
    parser: postHandler,
  },
]);
