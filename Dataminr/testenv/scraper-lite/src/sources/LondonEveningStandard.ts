import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseURLPrefix = 'https://www.standard.co.uk/';
const baseURLSuffix = 'news/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const headline = $el.text();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }
  const discussionTitleQuery = 'h1.sc-ccJWcV';
  const subHeadlineQuery = 'div.sc-fzCEhR';
  const dateQuery = '.publish-date';
  const articleTextQuery = '#main';

  $(elements).find('aside').remove();
  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const subHeadline = fetchText(subHeadlineQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'DD MMMM YYYY').format('MM/DD/YY');
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${subHeadline}; ${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
  };
  if (moment(dateText, 'DD MMMM YYYY').isSame(moment(), 'day')) {
    posts.push(
      new Post({
        text: newsInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser('London Evening Standard', baseURLPrefix, [
  {
    selector: ['.section-content a.title[href$=.html]'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseURLSuffix);
