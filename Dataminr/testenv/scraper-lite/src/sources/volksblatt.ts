import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseURL = 'https://www.volksblatt.li/';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  moment.locale('de');
  elements.forEach((el) => {
    const $el = $(el);
    const dateString = $el.find('.region').text().split('|')[1].trim();
    if (dateString.includes('Stunde') || dateString.includes('heute') || dateString.includes('Minute')) {
      const href = $el.attr('href');
      const title = $el.find('.titel').text();
      threads.push({
        link: href,
        title: `${dateString} # ${title}`,
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
  if (url === baseURL) {
    return posts;
  }
  moment.locale('de');
  const discussionTitleQuery = 'h1#body_hTitle';
  const dateQuery = '#body_divRegion';
  const articleTextQuery = '.news_content .lead,.news_content .text,.leadtop';

  const discussionTitle = fetchText(discussionTitleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements).split('|')[1].split('(')[0].trim();
  let date = '';
  if (dateText.includes('Minute')) {
    date = moment(dateText, 'vor mm Minute').format('MM/DD/YY');
  } else if (dateText.includes('Stunde')) {
    date = moment(dateText, 'vor hh Stunde').format('MM/DD/YY');
  } else if (dateText.includes('heute')) {
    date = moment(dateText, 'hh:mm').format('MM/DD/YY');
  }
  const articleText = fetchText(articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    Date: date,
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

export const parser = new LiteParser('Volksblatt', baseURL, [
  {
    selector: ['.startseite.startpage .topnews a,.sdablock a[href^=nachrichten/],.vbblock a[href^=nachrichten/]'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
