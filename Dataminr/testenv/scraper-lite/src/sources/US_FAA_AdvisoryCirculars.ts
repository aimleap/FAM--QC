import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const cheerio = require('cheerio');

const baseUrlPrefix = 'https://www.faa.gov';
const baseUrlSuffix = '/regulations_policies/advisory_circulars/model/actAttivioAsyncHandler.cfm?omni=ACs&rows=10&startAt=0&q=&display=current&parentTopicId=&draw=1&columns[0][data]=ac_content&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=false&columns[0][search][value]=&columns[0][search][regex]=false&columns[1][data]=documentnumber&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=false&columns[2][data]=date&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=false&columns[3][data]=rank&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&columns[3][search][regex]=false&start=0&length=10&search[value]=&search[regex]=false&_=1645696235018';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];
  const json = JSON.parse(response.body);
  const jsonArray = json.data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.date, 'MM-DD-YYYY');
    if (articlePublishedDate.isSame(moment(), 'day')) {
      const $el = cheerio.load(jObj.ac_content);
      const href = $el('a').attr('href');
      const headline = $el('a').text();
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
  const titleQuery = '.hGroup';
  const descriptionQuery = 'dt:contains(Description)+dd';
  const dateQuery = 'dt:contains(Date Issued)+dd';
  const responsibleOfficeQuery = 'dt:contains(Responsible Office)+dd';

  const title = fetchText(titleQuery, $, elements);
  const description = fetchText(descriptionQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const responsibleOffice = fetchText(responsibleOfficeQuery, $, elements);
  const date = moment(dateText, 'LL').format('MM/DD/YY');
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'US FAA Advisory Circulars';

  const newsInfo = `Title: ${title}, Description: ${description}, Date: ${date}, Source: ${source}`;
  const additionalDataInfo = `Responsible Office: ${responsibleOffice}`;
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

export const parser = new LiteParser(
  'US FAA Advisory Circulars',
  baseUrlPrefix,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseUrlSuffix,
);
