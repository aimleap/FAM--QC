import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const postDate = $el.find('.publishing-date').contents().last().text()
      .trim();
    if (moment(postDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const title = $el.find('.search-title').text().trim();
      const description = $el.find('.search-snippet').contents().first().text()
        .trim();
      const date = $el.find('.publishing-date').contents().last().text()
        .trim();

      const timeStamp = moment(date, 'MM/DD/YYYY').unix();
      const newsInfo = `Title: ${title}, Publishing Date: ${date}, Description: ${description}`;
      posts.push(
        new Post({
          text: newsInfo,
          postUrl: url,
          postedAt: timeStamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'OSCE',
  'https://www.osce.org/press-releases?page=0&filters=&solrsort=score%20desc&rows=50',
  [
    {
      selector: ['.panel-pane.pane-apachesolr-result>.pane-content .search-result-news'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
