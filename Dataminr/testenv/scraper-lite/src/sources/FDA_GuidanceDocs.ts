import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const moment = require('moment');

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const yesterday = moment().subtract(1, 'day');
  const jsonArray = JSON.parse(response.body);
  jsonArray.forEach((jsonObj: any) => {
    const issueDate = jsonObj.field_issue_datetime !== '' ? moment(jsonObj.field_issue_datetime, 'MM/DD/YYYY') : '';

    if (issueDate !== '') {
      if (moment(issueDate).isAfter(yesterday)) {
        const summary = $(jsonObj.title).text();
        const FDAOrganization = $(jsonObj.field_issuing_office_taxonomy).text();
        const topic = jsonObj.field_topics;
        const guidanceStatus = jsonObj.field_final_guidance_1;
        const commentClosingDate = jsonObj.field_comment_close_date;

        const link = $(jsonObj.field_associated_media_2).attr('href');
        const pdfLink = typeof link === 'undefined' ? '' : `https://www.fda.gov${link}`;
        const extraDataInfo = { PDF_Link: pdfLink };

        posts.push(
          new Post({
            text: `Summary: ${summary}, Issue Date: ${issueDate}, FDA Organization: ${FDAOrganization}, Topic: ${topic}, Guidance Status: ${guidanceStatus}, Comment Closing Date on Draft: ${commentClosingDate}`,
            postUrl: url,
            extraData: extraDataInfo,
          }),
        );
      }
    }
  });

  return posts;
}

export const parser = new LiteParser(
  'FDA guidance documents',
  'https://www.fda.gov/files/api/datatables/static/search-for-guidance.json',
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
);
