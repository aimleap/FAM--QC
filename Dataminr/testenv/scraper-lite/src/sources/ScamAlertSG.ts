import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseUrlPrefix = 'https://www.scamalert.sg';
const baseUrlSuffix = '/stories';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const publishedDate = $(el).find('.card-date.text-primary').text();
    if (moment(publishedDate, 'DD MMM YYYY').isSame(moment(), 'day')) {
      const href = $el.find('h4>a').attr('href');
      const headline = $el.find('h4>a').text();
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

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseUrlPrefix, baseUrlSuffix)) {
    return posts;
  }
  const titleQuery = 'h1';
  const descriptionQuery = '.container>div.row div.lead';
  const dateQuery = '.container>div.row h1+p.lead';

  const title = await fetchText(titleQuery, $, elements);
  const description = await fetchText(descriptionQuery, $, elements);
  const dateText = await fetchText(dateQuery, $, elements);
  const date = moment(dateText.split('|')[1].trim(), 'DD MMM YYYY').format('MM/DD/YY');
  const scamDetailName = $('.h5:contains(Scam Details)+p.lead')[0].childNodes[0].nodeValue.replace(/\n+/g, '').trim();
  const scamDetailContact = $('.h5:contains(Scam Details)+p.lead')[0].childNodes[2].nodeValue.replace(/\n+/g, '').trim();
  const timestamp = moment(date, 'MM/DD/YY').unix();
  const source = 'Scam Alert SG';

  const scamInfo = `${title} - ${description}`;
  const extraDataInfo = {
    Title: title,
    Description: description,
    'Scam Detail Name': scamDetailName,
    'Scam Detail Contact': scamDetailContact,
    Date: date,
    Source: source,
  };

  posts.push(
    new Post({
      text: scamInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Scam Alert SG', baseUrlPrefix, [
  {
    selector: ['#divStoryList>div'],
    parser: threadHandler,
  },
  {
    selector: ['main'],
    parser: postHandler,
    name: 'post',
  },
], baseUrlSuffix);
