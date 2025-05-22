import moment from 'moment';
import { Post, Thread } from '../lib/types';
import LiteParser from '../lib/parsers/liteParser';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const recallPostingDate = $el.find('td:eq(2)').text().replace(/\t+/g, '').replace(/\n+/g, '');

    if (moment(recallPostingDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('a').attr('href').replace('./', '/');
      const recallNo = $el.find('td:eq(1)').text().trim();
      const recallingFirm = $el.find('td:eq(3)').text().trim();
      const headline = `${recallNo}-${recallingFirm}`;

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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];

  const $el = $(elements);
  if (
    url.includes('https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRES/res.cfm?start_search=1')
  ) {
    return posts;
  }

  const productDescription = $el
    .find('tr>th[align=left]:not(th[nowrap]):contains(Product)+td')
    .text()
    .replace(/\n+/g, '')
    .replace(/\t+/g, '');
  const fdaRecallPostingDate = $el.find('tr>th:contains(Create Date)+td').text();
  const dataInfo = typeof data[0] !== 'undefined' ? data[0] : '';
  const recallClass = dataInfo.substr(0, dataInfo.indexOf('-'));
  const recallingFirm = dataInfo.substr(dataInfo.indexOf('-'));
  const manufacturerReasonForRecall = $el
    .find('tr>th:contains(Manufacturer Reason)+td')
    .text()
    .replace(/\n+/g, '')
    .replace(/\t+/g, '');
  const fdaDeterminedCause = $el
    .find('tr>th:contains(FDA Determined)+td')
    .text()
    .replace(/\n+/g, '')
    .replace(/\t+/g, '');
  const action = $el
    .find('tr>th:contains(Action)+td')
    .text()
    .replace(/\n+/g, '')
    .replace(/\t+/g, '');
  const timestamp = moment(fdaRecallPostingDate, 'LL').unix();

  const postInfo = `Product description: ${productDescription}, Recall class: ${recallClass}, FDA Recall Posting Date: ${fdaRecallPostingDate}, Recalling firm: ${recallingFirm}, Manufacturer Reason for Recall: ${manufacturerReasonForRecall}, FDA Determined Cause: ${fdaDeterminedCause}, Action: ${action}`;
  const extraDataInfo = {
    'Product description': productDescription,
    'Recall class': recallClass,
    'FDA Recall Posting Date': fdaRecallPostingDate,
    'Recalling firm': recallingFirm,
    'Manufacturer Reason for Recall': manufacturerReasonForRecall,
    'FDA Determined Cause': fdaDeterminedCause,
    Action: action,
  };

  posts.push(
    new Post({
      text: postInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US FDA Medical Device Recalls',
  'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRES/',
  [
    {
      selector: ['#res-results-table>tbody>tr:not(:has(th),:has(form))'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  'res.cfm?start_search=1&event_id=&productdescriptiontxt=&productcode=&IVDProducts=&rootCauseText=&recallstatus=&centerclassificationtypetext=&recallnumber=&postdatefrom=&postdateto=&productshortreasontxt=&firmlegalnam=&PMA_510K_Num=&pnumber=&knumber=&PAGENUM=50',
);
