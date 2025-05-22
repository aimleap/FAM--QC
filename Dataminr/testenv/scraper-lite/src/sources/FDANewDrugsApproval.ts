import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const dates: string[] = [];
  const $el = $(elements[0]);
  $el.find('h4').each((index, date) => {
    dates.push($(date).text());
  });
  $el.find('table').each((index, div) => {
    $(div)
      .find('tbody tr')
      .each((_rowIndex, row) => {
        const drugNameAndApplicationNumber = $(row).find('td:nth-child(1) a').text();
        const activeIngridient = $(row).find('td:nth-child(2)').text();
        const date = moment(dates[index]).format('MM/DD/YYYY');
        const submission = $(row).find('td:nth-child(4)').text();
        const company = $(row).find('td:nth-child(5)').text();
        const dosageForm = $(row).find('td:nth-child(3)').text();
        const submissionClassification = $(row).find('td:nth-child(6)').text();
        const submissionStatus = $(row).find('td:nth-child(7)').text();
        posts.push(
          new Post({
            text: `Drug Name and Application Number: ${drugNameAndApplicationNumber}, Active Ingridient: ${activeIngridient}, Date: ${date}, Submission: ${submission}, Company: ${company}, Dosage form/Route: ${dosageForm}, Submission Classification: ${submissionClassification}, Submission Status: ${submissionStatus}`,
            postUrl: url,
            postedAt: moment(date).startOf('day').unix(),
            extraData: {
              'Drug Name and Application Number': drugNameAndApplicationNumber,
              'Active Ingridient': activeIngridient,
              Date: date,
              Submission: submission,
              Company: company,
              'Dosage form/Route': dosageForm,
              'Submission Classification': submissionClassification,
              'Submission Status': submissionStatus,
            },
          }),
        );
      });
  });
  return posts;
}

export const parser = new LiteParser(
  'FDANewDrugsApproval',
  'https://www.accessdata.fda.gov/',
  [
    {
      selector: ['#example2-tab2'],
      parser: postHandler,
    },
  ],
  '/scripts/cder/daf/index.cfm?event=report.page',
);
