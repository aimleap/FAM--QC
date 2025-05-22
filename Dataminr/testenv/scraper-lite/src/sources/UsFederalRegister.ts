import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

function getTodaysDate() {
  const date = moment().format('YYYY-MM-DD');
  return date;
}

async function baseUrlHandler(): Promise<Thread[]> {
  const urlThreads: Thread[] = [];

  urlThreads.push({
    link: `https://www.federalregister.gov/documents/search?conditions%5Bpublication_date%5D%5Bis%5D=${getTodaysDate()}&order=newest`,
    parserName: 'baseUrlThread',
  });

  return urlThreads;
}

async function preThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const preThreads: Thread[] = [];

  const count = $(elements).find('.item-count').text();
  const noOfPages = Math.ceil(Number(count) / 20);

  for (let index = 1; index <= noOfPages; index++) {
    preThreads.push({
      link: `${url}&page=${index}`,
      parserName: 'thread',
    });
  }
  return preThreads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  if (url === 'https://www.federalregister.gov/') {
    return threads;
  }
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.find('a').attr('href');
    const headline = $el.find('a').text();

    if (href !== undefined) {
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
  const $el = $(elements);

  if (url === 'https://www.federalregister.gov/') {
    return posts;
  }
  const title = $(elements)
    .find('#main div.metadata-content-area h1')
    .text()
    .replace(/\n+/g, '')
    .trim();
  let agency = $(elements).find('h1:contains(AGENCY:)+p').text().replace(/\n+/g, '')
    .trim();
  if (agency === undefined) agency = $el.find('dt:contains(Agencies:)+dd').text().replace(/\n+/g, '').trim();

  const action = $(elements).find('h1:contains(ACTION:)+p').text().replace(/\n+/g, '')
    .trim();
  const summary = $(elements)
    .find('h1:contains(SUMMARY:)+p')
    .text()
    .replace(/\n+/g, '')
    .replace(/\s\s+/g, ' ')
    .trim();
  const documentType = $el.find('dt:contains(Document Type:)+dd').text().replace(/\n+/g, '').trim();
  const publicationDate = $el
    .find('dt:contains(Publication Date:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const timestamp = moment(publicationDate, 'MM/DD/YYYY').unix();

  const effectiveDate = $el
    .find('dt:contains(Effective Date:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const commentsClose = $el
    .find('dt:contains(Comments Close:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const documentCitation = $el
    .find('dt:contains(Document Citation:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const page = $el.find('dt:contains(Page:)+dd').text().replace(/\s\s+/g, ' ').trim();
  const cfr = $el.find('dt:contains(CFR:)+dd').text().replace(/\n+/g, '').trim();
  const agencyOrDocketNumber = $el
    .find('dt:contains(Agency/Docket Number:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const rin = $el.find('dt:contains(RIN:)+dd').text().replace(/\n+/g, '').trim();
  const documentNumber = $el
    .find('dt:contains(Document Number:)+dd')
    .text()
    .replace(/\n+/g, '')
    .trim();

  const additionalData = `Effective Date: ${effectiveDate}; Comments Close: ${commentsClose}; Document Citation: ${documentCitation}; Page: ${page}; CFR: ${cfr}; Agency/Docket Number: ${agencyOrDocketNumber}; RIN: ${rin}; Document Number: ${documentNumber}`;
  const documentInfo = `Title: ${title}, Discription: ${summary}, Date: ${publicationDate}, Entities (source): ${agency}, Type (customizable): ${documentType}, Action: ${action}, Additional Data: ${additionalData}`;
  const extraDataInfo = {
    Title: title,
    Discription: summary,
    Date: publicationDate,
    'Entities (source)': agency,
    'Type (customizable)': documentType,
    Action: action,
    'Additional Data': additionalData,
  };
  posts.push(
    new Post({
      text: documentInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('US Federal Register', 'https://www.federalregister.gov/', [
  {
    selector: ['*'],
    parser: baseUrlHandler,
  },
  {
    selector: ['div.search_info'],
    parser: preThreadHandler,
    name: 'baseUrlThread',
  },
  {
    selector: ['ul>li h5'],
    parser: threadHandler,
    name: 'thread',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
