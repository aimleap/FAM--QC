import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

function getTodaysDate() {
  const date = moment().format('YYYY');
  return date;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];

  elements.forEach((el) => {
    moment.locale('ja');
    const $el = $(el);
    const dateInfo = $el.find('th').text().trim();
    const date = dateInfo.startsWith('0') ? dateInfo.substring(1) : dateInfo;
    const publishDate = moment(date, 'MMMM DD');
    if (publishDate.isSame(moment(), 'day')) {
      const href = $el.find('td>a').attr('href').replace('jp/jvndb', `jp/en/contents/${getTodaysDate()}`);
      const link = `${href}.html`;
      const urlName = $el.find('td>a').text().trim();
      const rating = $el.find('.keikoku').text().trim();
      threads.push({
        link,
        title: `${date}@${rating}@${urlName}`,
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
  if (url === 'https://www.ipa.go.jp/security/vuln/documents/index.html') {
    return posts;
  }
  const titleQuery = 'h2 font';
  const titleDescriptionQuery = '.vuln_table_clase tr:eq(2)';
  const overviewQuery = '.vuln_table_clase tr:contains(Overview)+tr';
  const CVSSSeverityQuery = '.vuln_table_clase tr:contains(CVSS Severity)+tr';
  const affectedProductsQuery = '.vuln_table_clase tr:contains(Affected Products)+tr+tr,.vuln_table_clase tr:contains(Affected Products)+tr+tr+tr';
  const impactQuery = '.vuln_table_clase tr:contains(Impact)+tr';
  const solutionQuery = '.vuln_table_clase tr:contains(Solution)+tr';
  const vendorInformationQuery = '.vuln_table_clase tr:contains(Vendor Information)+tr';
  const CWEQuery = '.vuln_table_clase tr:contains(CWE (What is CWE?))+tr';
  const CVEQuery = '.vuln_table_clase tr:contains(CVE (What is CVE?))+tr';
  const referencesQuery = '.vuln_table_clase tr:contains(References)+tr';
  const revisionHistoryQuery = '.vuln_table_clase tr:contains(Revision History)+tr';
  const lastUpdatedQuery = '.modifytxt:contains(Last Updated:)';

  const dataInfo = data[0].split('@');
  const date = dataInfo[0];
  const rating = dataInfo[1];
  const urlName = dataInfo[2];
  const title = fetchText(titleQuery, $, elements);
  const titleDescription = fetchText(titleDescriptionQuery, $, elements);
  const overview = fetchText(overviewQuery, $, elements);
  const CVSSSeverity = fetchText(CVSSSeverityQuery, $, elements);
  const affectedProducts = fetchText(affectedProductsQuery, $, elements);
  const impact = fetchText(impactQuery, $, elements);
  const solution = fetchText(solutionQuery, $, elements);
  const vendorInformation = fetchText(vendorInformationQuery, $, elements);
  const cwe = fetchText(CWEQuery, $, elements);
  const cve = fetchText(CVEQuery, $, elements);
  const references = fetchText(referencesQuery, $, elements);
  const revisionHistory = fetchText(revisionHistoryQuery, $, elements);
  const lastUpdated = fetchText(lastUpdatedQuery, $, elements).split(':')[1].trim();
  const timestamp = moment(date, 'MMMM DD').unix();
  const newsInfo = `Date: ${date}, Rating: ${rating}, URL Name: ${urlName}, URL: ${url}`;
  const extraDataInfo = {
    'Last Updated': lastUpdated,
    Title: title,
    'Title Description': titleDescription,
    Overview: overview,
    'CVSS Severity': CVSSSeverity,
    'Affected Products': affectedProducts,
    Impact: impact,
    Solution: solution,
    'Vendor Information': vendorInformation,
    CWE: cwe,
    CVE: cve,
    References: references,
    'Revision History': revisionHistory,
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

export const parser = new LiteParser('Information-technology Promotion Agency, Japan (IPA)', 'https://www.ipa.go.jp/security/vuln/documents/index.html', [
  {
    selector: [`h2:contains(${getTodaysDate()})+div>table>tbody>tr`],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
