import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'New Security Advisories, Notices and Resources',
  isCloudFlare: true,
  name: 'Adobe',
  type: SourceTypeEnum.FORUM,
  url: 'https://helpx.adobe.com/uk/security/security-bulletin.html',
  injectHeaders: true,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('td:nth-child(1) a').text().trim();
    const link = `https://access.redhat.com${$(el).find('td:nth-child(1) a').attr('href')}`;
    const date = $(el).find('td:nth-child(2)').text().trim();
    const timestamp = moment(date, 'MM/DD/YYYY').unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads.filter((thread) => thread.title !== '');
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const published = $(elements)
    .find(
      'div[class="table aem-GridColumn aem-GridColumn--default--12"] table tr:last-child td:nth-child(2) p',
    )
    .text()
    .trim();
  let update = $(elements).find('span[class="publish-date"]').text().trim();
  const synpopsis = $(elements).find('span[style="color: rgb(80,80,80);"]').text().trim();
  if (update === '' || update === undefined) {
    update = published;
  }
  const affectedElements = $(elements)
    .find(
      'div[class="table aem-GridColumn--default--none aem-GridColumn aem-GridColumn--default--12 aem-GridColumn--offset--default--0"] div[data-emptytext="Table"] tbody tr',
    )
    .get()
    .slice(1);
  const affectedprodArr: string[] = []; // Declare as array of strings
  const affectedverArr: string[] = []; // Declare as array of strings
  const platformArr: string[] = []; // Declare as array of strings
  affectedElements.forEach((item) => {
    affectedprodArr.push($(item).find('td:nth-child(1) p').text().trim());
    affectedverArr.push($(item).find('td:nth-child(3) p').text().trim());
    platformArr.push($(item).find('td:nth-child(4) p').text().trim());
  });
  const affectedProducts = affectedprodArr.join(', ');
  const affectedVersions = affectedverArr.join(', ');
  const platform = platformArr.join(', ');
  const title = $(elements).find('meta[name="description"]').attr('content');
  const cves = $(elements)
    .find(
      'div[class="text first-heading aem-GridColumn aem-GridColumn--default--newline aem-GridColumn--default--12 aem-GridColumn--offset--default--0 overflowScroll"] table tbody tr td:last-child b',
    )
    .get()
    .map((element) => $(element).text().trim())
    .join(', ');
  const timestamp = moment.utc(published, 'MMMM DD, YYYY').unix();
  posts.push(
    new Post(
      `Title: ${title}; Originally posted: ${published}: Last updated: ${update}: Summary: ${synpopsis}: CVE numbers`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          published,
          update,
          cves,
          release: '',
          affectedProducts,
          affectedVersions,
          platform,
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
      selector: ['table'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
