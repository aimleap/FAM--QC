import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'New Security Bulletins and Briefs',
  isCloudFlare: true,
  name: 'AMD',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.amd.com/en/resources/product-security.html',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('td:nth-child(2) a').text().trim();
    const link = `https://www.amd.com${$(el).find('td:nth-child(2) a').attr('href')}`;
    const time = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = moment.utc(time, 'MMM DD, YYYY').unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const text = $(elements)
    .find(
      'div[class="title aem-GridColumn aem-GridColumn--default--12"] + div[class="text lightTableStyle borderTableStyle headerTableStyle aem-GridColumn aem-GridColumn--default--12"] div[class="cmp-text"]:nth-child(1)',
    )
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const extractField = (fieldName: string, text: string) => {
    const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };
  const amdid = extractField('AMD ID', text);
  const potentialImpact = extractField('Potential Impact', text);
  const severity = extractField('Severity', text);
  const summary = extractField('Summary', text);
  const cveElements = $(elements).find('table[class="MsoTableGrid"] tbody tr').get().slice(1);
  const cvesArr: string[] = []; // Declare as array of strings
  cveElements.forEach((item) => {
    const cveText = $(item).find('td:nth-child(1)').text().trim();
    cvesArr.push(cveText); // Push strings into the array
  });
  const cves = cvesArr.join(', ');
  const updated = $(elements)
    .find('table[class="Table"] tr:nth-child(2) td:nth-child(1)')
    .text()
    .trim();
  const published = $(elements)
    .find('table[class="Table"] tr:last-child td:nth-child(1)')
    .text()
    .trim();
  const title = $(elements).find('h1[class="cmp-title__text"]').text().trim();
  const timestamp = moment.utc(published, 'YYYY-MM-DD').unix();
  posts.push(
    new Post(
      `Title: ${title}, Potential Impact: ${potentialImpact}, Severity: ${severity}, Summary: ${summary}, CVEs: ${cves}, Published Date: ${published}, Last Updated Date: ${updated}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          amdid,
          published,
          updated,
          cves,
          severity,
          impact: potentialImpact,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['table[class="table table-striped table-bordered"] tbody tr'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div.col-xl-9'],
      handler: postHandler,
    },
  ],
  1440,
);
