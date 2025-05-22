import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { appendLink } from '../lib/parserUtil';
import { Post, Thread } from '../lib/types';

const urlPrefix = 'https://cybersecurity-jp.com';
const urlSuffix = '/news';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.date').text().replace(/\n+/g, '')
      .replace(/\s+/g, ' ');
    if (moment(publishedDate, 'YYYY.MM.DD').isSame(moment(), 'day')) {
      const href = $el.find('.post-title a').attr('href');
      const headline = $el.find('.post-title').text().replace(/\n+/g, '').replace(/\t+/g, '');
      const description = $('.post-content')[0].childNodes[2].nodeValue.replace(/\n+/g, '').replace(/\s+/g, ' ').trim();
      threads.push({
        link: href,
        title: `${headline}~${description}~${publishedDate}`,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const $el = $(elements);
  if (url === appendLink(urlPrefix, urlSuffix)) {
    return posts;
  }

  const titleOuter = data[0].split('~')[0];
  const titleInner = $el.find('h1.post-title').text().trim();
  const description = data[0].split('~')[1];
  let date = data[0].split('~')[2];
  date = moment(date, 'YYYY.MM.DD').format('MM/DD/YYYY');
  const newsUrl = url;
  let releaseDate = $el.find('.post-header .date').text().replace(/\n+/g, '').replace(/\s+/g, ' ')
    .trim()
    .split('｜')[0].replace('公開日：', '');
  releaseDate = moment(releaseDate, 'YYYY.MM.DD').format('MM/DD/YYYY');
  let updatedDate = $el.find('.post-header .date').text().replace(/\n+/g, '').replace(/\s+/g, ' ')
    .trim()
    .split('｜')[1].replace('最終更新日：', '');
  updatedDate = moment(updatedDate, 'YYYY.MM.DD').format('MM/DD/YYYY');
  const articleText = $el.find('.main-inner .post-content .post-thumbnail p:not(.dist)').text().replace(/\n+/g, '');
  const reference = $el.find('.post-content p:contains(参照) a').text().replace(/\n+/g, '').trim();
  const referenceUrl = $el.find('.post-content p:contains(参照) a').attr('href').trim();
  const timestamp = moment(releaseDate, 'MM/DD/YYYY').unix();
  const newsInfo = `Title: ${titleOuter}, Description: ${description}, Date: ${date}, URL: ${newsUrl}`;
  const additionalDataInfo = `Title: ${titleInner}, Release Date: ${releaseDate}, Last Updated: ${updatedDate}, Article Text: ${articleText}, Reference: ${reference}, Reference URL: ${referenceUrl}`;
  const extraDataInfo = { 'Additional Data': additionalDataInfo };
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

export const parser = new LiteParser(
  'Japan Cyber Security',
  urlPrefix,
  [
    {
      selector: ['.main-inner .post'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  urlSuffix,
);
