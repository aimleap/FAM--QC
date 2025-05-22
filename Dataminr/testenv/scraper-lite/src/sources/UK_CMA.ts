import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.gem-c-document-list__attribute time').text().trim();
    if (moment(publishedDate, 'DD MMMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href');
      const headline = $(el).find('.gem-c-document-list__attribute time').text().trim();
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
  if (
    url
    === 'https://www.gov.uk/search/all?organisations%5B%5D=competition-and-markets-authority&order=updated-newest&parent=competition-and-markets-authority'
  ) {
    return posts;
  }
  const postTitle = $(elements).find('h1.gem-c-title__text').text().replace(/\n+/g, '')
    .trim();
  const description = $(elements).find('.gem-c-lead-paragraph').text().replace(/\n+/g, '')
    .trim();
  let dateInfo = $(elements).find('dt:contains(Last updated)+dd').text().trim();
  if (dateInfo.length === 0) {
    dateInfo = $(elements).find('dt:contains(Published)+dd').text().trim();
  }
  const date = moment(dateInfo.split('—')[0].trim(), 'DD MMMM YYYY').format('MM/DD/YY');
  const source = 'UK CMA';
  const type = $(elements)
    .find('.gem-c-title>.gem-c-title__context')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const fullText = $(elements)
    .find('.gem-c-govspeak.govuk-govspeak')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const timestamp = moment(date, 'MM/DD/YY').unix();

  const newsInfo = `Title: ${postTitle}, Description: ${description}, Date: ${date}, Source: ${source}, Type: ${type}`;
  const extraDataInfo = { 'Additional Data': fullText };
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
  'UK CMA',
  'https://www.gov.uk',
  [
    {
      selector: ['.gem-c-document-list>.gem-c-document-list__item'],
      parser: threadHandler,
    },
    {
      selector: ['.direction-ltr'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/search/all?organisations%5B%5D=competition-and-markets-authority&order=updated-newest&parent=competition-and-markets-authority',
);
