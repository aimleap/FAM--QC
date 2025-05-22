import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://supplychaindigital.com';
const baseURLSuffix = '/articles';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const href = $el.attr('href');
    threads.push({
      link: href,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const $el = $(elements);
  const date = $el.find('.ArticleHeader_Details__3n5Er .Breadcrumbs_Breadcrumbs__3yIKi > div:eq(0)').text().trim();
  if (moment(date, 'MMMM DD, YYYY').isSame(moment(), 'day')) {
    const headlineQuery = '#content h1';
    const subHeadingQuery = '.Type_m-heading8__NOAVC';
    const textQuery = '.Prose_Prose__2zaJW';

    const headline = fetchText(headlineQuery, $, elements);
    const subHeading = fetchText(subHeadingQuery, $, elements);
    const text = fetchText(textQuery, $, elements);

    const timestamp = moment(date, 'MMMM DD, YYYY').unix();
    const textInfo = `${headline} ; ${subHeading} ; ${text}`;
    const extraDataInfo = {
      Headline: headline,
      Description: subHeading,
      Text: text,
      Date: date,
    };

    posts.push(
      new Post({
        text: textInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Supply Chain Digital',
  baseURLPrefix,
  [
    {
      selector: ['a[class^=SimpleList_SimpleListLink],a[class^=Card_CardOverlayLink]'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  baseURLSuffix,
);
