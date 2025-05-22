import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrl = 'https://wizchan.org/all/';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const h2Array: string[] = [];
  $(elements).find('h2').each((x, h2) => {
    h2Array.push($(h2).text());
  });
  let k = 0;
  $(elements)
    .find('h2+div.thread')
    .each((_index, eachDiv) => {
      const boardName = h2Array[k];
      $(eachDiv).find('.unimportant').remove();
      $(eachDiv).find('a:contains([)').remove();
      const mainFileName = $(eachDiv).find('div.files:not(.post div.files)').text().trim();
      const href = $(eachDiv).find('div.files:not(.post div.files) .fileinfo>a').attr('href');
      const mainFileLink = href !== undefined ? `https://wizchan.org${href}` : '';
      $(eachDiv).find('div.post').each((_Index, eachPost) => {
        const title = $(eachPost).find('p.intro').text();
        const userName = $(eachPost).find('p.intro label>span.name').text();
        const dateTime = $(eachPost).find('p.intro label>time').text();
        const description = $(eachPost).find('div.body').text();
        const postFileName = $(eachPost).find('div.files').text().trim();
        const postHref = $(eachPost).find('.fileinfo>a').attr('href');
        const postFileLink = postHref !== undefined ? `https://wizchan.org${postHref}` : '';
        const commentUrlText = $(eachPost).find('div.body a').text().trim();
        const commentUrlHref = $(eachPost).find('div.body a').attr('href');
        const commentUrl = commentUrlHref !== undefined ? `https://wizchan.org${commentUrlHref}` : '';
        const timestamp = moment(dateTime, 'MM/DD/YY (ddd) hh:mm:ss').unix();
        const currentHref = $(eachPost).find('a.post_no:not(a[id^=post_no])').attr('href');
        const currentUrl = currentHref !== undefined ? `https://wizchan.org${currentHref}` : '';
        const articleInfo = `${boardName} ; ${title} ; ${userName} ; ${dateTime} ; ${mainFileName} ${mainFileLink} ; ${postFileName} ${postFileLink} ; ${commentUrlText} ${commentUrl}; ${description}`;
        posts.push(
          new Post({
            text: articleInfo,
            postUrl: currentUrl,
            postedAt: timestamp,
          }),
        );
      });
      k += 1;
    });
  return posts;
}

export const parser = new LiteParser('Wizard Chan', baseUrl, [
  {
    selector: ['form'],
    parser: postHandler,
  },
]);
