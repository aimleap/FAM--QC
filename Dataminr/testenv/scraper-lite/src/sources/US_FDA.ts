import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.fda.gov';
const baseUrlSuffix = '/medical-devices/guidance-documents-medical-devices-and-radiation-emitting-products/recent-final-medical-device-guidance-documents';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('td:eq(1)').text();
    if (moment(publishedDate, 'MM/DD/YY').isSame(moment(), 'day')) {
      const href = $el.find('td>a').attr('href');
      const headline = $el.find('td>a').text();
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, '')
    .trim();
}

async function extractText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  const tempText: string[] = [];
  $(elements).find(`${cssSelector}`).each((_index, el) => {
    tempText.push($(el).text().replace(/\n+/g, '').replace(/\t+/g, '')
      .trim());
  });
  return tempText;
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
  const discriptionQuery = 'div[role="main"]>p';
  const dateQuery = '.node-current-date time';
  const docketNumberQuery = 'dt:contains(Docket Number:)+dd';
  const regulatedProductsQuery = 'h2:contains(Regulated Product(s))+ul>li';
  const topicsQuery = 'h2:contains(Topic(s))+ul>li';

  const title = $('h1.content-title')[0].childNodes[0].nodeValue.trim();
  const description = await fetchText(discriptionQuery, $, elements);
  const dateText = await fetchText(dateQuery, $, elements);
  const date = moment(dateText, 'MM/DD/YYYY').format('MM/DD/YY');
  const docketNumber = await fetchText(docketNumberQuery, $, elements);
  const regulatedProducts = await extractText(regulatedProductsQuery, $, elements);
  const topics = await extractText(topicsQuery, $, elements);
  const source = 'US FDA';
  const type = 'Guidance Document';

  const additionalData = `Docket Number: ${docketNumber}; Regulated Product(s): ${regulatedProducts}; Topic(s): ${topics}`;
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const newsInfo = `Title: ${title}, Description: ${description}, Date: ${date}, Type: ${type}, Source: ${source}`;
  const extraDataInfo = {
    'Additional Data': additionalData,
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

export const parser = new LiteParser('US FDA', baseUrlPrefix, [
  {
    selector: ['.table-responsive>table>tbody>tr'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
