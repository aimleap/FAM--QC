import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.shift();
  elements.shift();
  elements.forEach((el) => {
    const $el = $(el);
    if (
      !moment(
        $el.find('td:nth-child(4)').text().replace(/\t+/g, '').replace(/\n+/g, ''),
        'MM/DD/YYYY',
      ).isSame(moment(), 'day')
    ) return;
    const deviceName = $el.find('td:nth-child(1)').text().replace(/\t+/g, '').replace(/\n+/g, '');
    const applicant = $el.find('td:nth-child(2)').text().replace(/\t+/g, '').replace(/\n+/g, '');
    const number = $el.find('td:nth-child(3)').text().replace(/\t+/g, '').replace(/\n+/g, '');
    const decisionDate = $el.find('td:nth-child(4)').text().replace(/\t+/g, '').replace(/\n+/g, '');
    posts.push(
      new Post({
        text: `Device Name: ${deviceName}; Applicant: ${applicant}; 510(k) Number: ${number}; Decision Date: ${decisionDate}`,
        postUrl: url,
        postedAt: moment(decisionDate, 'MM/DD/YYYY').unix(),
        extraData: {
          'Device Name': deviceName,
          Applicant: applicant,
          '510(k) Number': number,
          'Decision Date': decisionDate,
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'UsFDAPreMarketNotifications',
  'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?start_search=1&Center=&Panel=&ProductCode=&KNumber=&Applicant=&DeviceName=&Type=&ThirdPartyReviewed=&ClinicalTrials=&Decision=&DecisionDateFrom=&DecisionDateTo=11%2F24%2F2021&IVDProducts=&Redact510K=&CombinationProducts=&ZNumber=&PAGENUM=25',
  [
    {
      selector: ['#user_provided > table:nth-child(3) > tbody > tr > td > table > tbody > tr'],
      parser: postHandler,
    },
  ],
);
