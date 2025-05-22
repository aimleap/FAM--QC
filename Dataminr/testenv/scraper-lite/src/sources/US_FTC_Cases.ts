import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';
import { fetchText } from '../lib/sourceUtil';

const baseUrlPrefix = 'https://www.ftc.gov';
const baseUrlSuffix = '/legal-library/browse/cases-proceedings';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const updatedDate = $(el).find('.field .field__item time').text();
    if (moment(updatedDate, 'LL').isSame(moment(), 'day')) {
      const href = $el.find('h3.node-title a').attr('href');
      const headline = $el.find('h3.node-title a').text();
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

  const titleQuery = 'h1.margin-0';
  const dateQuery = '.main-content .node__content .field--label-inline .field__items time';
  const caseStatusQuery = '.main-content .node__content .field--name-field-case-status .field__items';
  const fileNumberQuery = '.main-content .node__content .field--name-field-matter-number .field__items';
  const docketNumberQuery = '.main-content .node__content .field--name-field-docket-number .field__items';
  const enforcementTypeQuery = '.main-content .node__content .field--name-field-enforcement-type .field__items';
  const caseSummaryQuery = '.main-content .node__content .field--name-body .field__items';

  const title = fetchText(titleQuery, $, elements);
  const dateText = fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'LL').format('MM/DD/YY');
  const source = 'US FTC';
  const type = 'Enforcement';
  const caseStatus = fetchText(caseStatusQuery, $, elements);
  const fileNumber = fetchText(fileNumberQuery, $, elements);
  const docketNumber = fetchText(docketNumberQuery, $, elements);
  let enforcementType = fetchText(enforcementTypeQuery, $, elements);
  if (enforcementType.length === 0) {
    enforcementType = 'n/a';
  }
  const caseSummary = fetchText(caseSummaryQuery, $, elements);
  const additionalData = `Case Status: ${caseStatus}; FTC MATTER/FILE NUMBER: ${fileNumber}; DOCKET NUMBER: ${docketNumber}; ENFORCEMENT TYPE: ${enforcementType}; Case Summary: ${caseSummary}`;
  const timestamp = moment(date, 'LL').unix();
  const caseInfo = `Title: ${title}, Date: ${date}, Source: ${source}, Type: ${type}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
  };

  posts.push(
    new Post({
      text: caseInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'US FTC Cases & Proceedings',
  baseUrlPrefix,
  [
    {
      selector: ['#content .region  .view__content .views-row .node__content'],
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
