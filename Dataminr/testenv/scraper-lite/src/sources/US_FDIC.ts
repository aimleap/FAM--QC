import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.financialInstitutionLetters;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.date !== '' ? jObj.date : '';
    if (articlePublishedDate !== '') {
      if (moment(articlePublishedDate, 'LL').isSame(moment())) {
        const { href } = jObj;
        const { category } = jObj;

        threads.push({
          link: href,
          title: category,
          parserName: 'post',
        });
      }
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

  if (
    url
    === 'https://www.fdic.gov/news/financial-institution-letters/data/financial-institution-letters.json'
  ) {
    return posts;
  }

  const title = $el.find('.filtitle').text().replace(/\n+/g, '').replace(/\t+/g, '')
    .trim();
  const summary = $el.find('article').text().replace(/\n+/g, '').replace(/\t+/g, '')
    .trim();
  const dateIssued = $el.find('.fildate').text().replace(/\n+/g, '').trim();
  const entitiesSource = 'US FDIC';
  const category = data[0];
  const filNumber = $el.find('.filnum').text().replace(/\n+/g, '').trim();
  const timestamp = moment(dateIssued, 'LL').unix();

  const additionalData = `${filNumber} - ${title}`;
  const filInfo = `Title: ${title}, Description: ${summary}, Date: ${dateIssued}, Entities (source): ${entitiesSource}, Type: ${category}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    Title: title,
    Discription: summary,
    Date: dateIssued,
    'Entities (source)': entitiesSource,
    Type: category,
    'Additional Data': additionalData,
  };

  posts.push(
    new Post({
      text: filInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US FDIC',
  'https://www.fdic.gov',
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['#main-content'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/news/financial-institution-letters/data/financial-institution-letters.json',
);
