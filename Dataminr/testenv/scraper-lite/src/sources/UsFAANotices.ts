import moment from 'moment';
import { Response } from 'request';
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
  try {
    const json = JSON.parse(response.body);
    if (json && json.data !== undefined && json.data.length > 0) {
      json.data.forEach((row: any) => {
        threads.push({
          link: row.on_content.match('href="([^"]*)')[1],
          parserName: 'post',
        });
      });
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    try {
      const $el = $(el);
      const documentTypeIndex = $el.find("dt:contains('Type')").index();
      const documentType = $el
        .find(`dd:nth-child(${documentTypeIndex + 2})`)
        .text()
        .trim();
      const directiveIndex = $el.find("dt:contains('Title')").index();
      const directive = $el
        .find(`dd:nth-child(${directiveIndex + 2})`)
        .text()
        .trim();
      const dateIndex = $el.find("dt:contains('Date Issued')").index();
      const date = moment(
        $el
          .find(`dd:nth-child(${dateIndex + 2})`)
          .text()
          .trim(),
        'MMMM DD[,] YYYY',
      ).format('MM/DD/YYYY');
      const descriptionIndex = $el.find("dt:contains('Description')").index();
      const description = $el
        .find(`dd:nth-child(${descriptionIndex + 2})`)
        .text()
        .trim();
      const message = `Document Type: ${documentType}, Directive: ${directive}, Date: ${date}, Description: ${description}`;
      posts.push(
        new Post({
          text: message,
          postUrl: url,
          postedAt: moment(date, 'MM/DD/YYYY').unix(),
          extraData: { 'No Of Columns': 4 },
        }),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new LiteParser(
  'US FAA Notices',
  'https://www.faa.gov/',
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['#content div dl'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/regulations_policies/orders_notices/model/actAttivioAsyncHandler.cfm?omni=OrdersNotices&rows=10&startAt=0&q=&documentTypeIDList=3&display=current&parentTopicID=&draw=1&columns%5B0%5D%5Bdata%5D=documenttype&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=documentnumber&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=on_content&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=date&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=rank&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=10&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1634883000527',
);
