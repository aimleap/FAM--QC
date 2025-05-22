import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.minister.defence.gov.au';
const baseUrlSuffix = '/news-media';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const publishedDate = $(el).find('.date-display-single').text();
    if (moment(publishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $(el).find('h2>a').attr('href');
      const headline = $(el).find('h2').text();
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = '.pane-content h1';
  const fullTextQuery = '.pane-minister-content-details-panel-pane-minister-lhs-details-by-nid>.pane-content>.view-minister-content-details';
  const dateQuery = '.pane-node-field-publish-date';

  const title = fetchText(titleQuery, $, elements);
  const fullTextOfPost = fetchText(fullTextQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'Australian Department of Defense';

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}, Additional Data: ${fullTextOfPost}`;
  const additionalDataInfo = `Additional Data: ${fullTextOfPost}`;
  const extraDataInfo = {
    'Additional Data': additionalDataInfo,
  };

  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Australian Department of Defense', baseUrlPrefix, [
  {
    selector: ['.pane-content .view-content>.views-row'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
