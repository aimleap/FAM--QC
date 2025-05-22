import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'a', 'a').map((t) => ({
    ...t,
    parserName: 'post',
  }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url === 'https://www.auswaertiges-amt.de/de/ReiseUndSicherheit/10.2.8Reisewarnungen') {
    return posts;
  }

  const yesterday = moment().subtract(1, 'day').format('DD.MM.YYYY');
  const today = moment().format('DD.MM.YYYY');
  const $el = $(elements);
  const dateInfo = $el.find('.heading__meta').text().split('(')[1].replace(')', '');
  if (
    typeof dateInfo !== 'undefined'
    && (dateInfo.includes(yesterday) || dateInfo.includes(today))
  ) {
    const title = $el.find('.heading__title-text').text().replace(/\n+/g, '').trim();
    const country = title.split(':')[0].replace(/\n+/g, '').trim();
    const updated = dateInfo.split(':')[1].replace(/\n+/g, '').trim();
    const description = $($el.find('.heading__intro').toString().replace('Letzte Änderungen:', '').replaceAll('<br>', ' ')).text().trim();
    const timestamp = moment(updated, 'DD.MM.YYYY').unix();

    const travelInfo = `Country: ${country}, Update Date: ${updated}, Description: ${description}`;
    const extraDataInfo = { Country: country, 'Update Date': updated, Description: description };

    posts.push(
      new Post({
        text: travelInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  }
  return posts;
}

export const parser = new LiteParser(
  'Germany Foreign Ministry',
  'https://www.auswaertiges-amt.de',
  [
    {
      selector: ['.rte__heading2+ul>li'],
      parser: threadHandler,
    },
    {
      selector: ['#main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/de/ReiseUndSicherheit/10.2.8Reisewarnungen',
);
