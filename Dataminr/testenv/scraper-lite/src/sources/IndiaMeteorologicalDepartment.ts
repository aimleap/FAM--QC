import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://mausam.imd.gov.in';

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  const link1 = 'https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=1';
  const link2 = 'https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=13';
  const link3 = 'https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=24';
  const link4 = 'https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=26';
  const urls = [link1, link2, link3, link4];
  for (let i = 0; i < urls.length; i++) {
    threads.push({
      link: urls[i],
      parserName: 'post',
    });
  }
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const titleTags: string[] = [];
  if (url === baseURL) {
    return posts;
  }
  const timestamp = moment().unix();

  const colorMap = new Map([
    ['#7CFC00', 'Green'],
    ['#FFFF00', 'Yellow'],
    ['#FFA500', 'Orange'],
    ['#FF0000', 'Red'],
  ]);
  elements.forEach((el) => {
    const titleText = $(el).has('th').text();
    if (titleText !== '' && !titleText.includes('Date of Issue')) titleTags.push(titleText);
  });
  let j = 0;
  let l = 0;
  for (let i = 0; i < titleTags.length; i++) {
    const title = titleTags[i];
    const dateText = $(elements[l + 1]).text()?.split(':')[1]?.trim();
    for (let k = j + 1; k < j + 9; k++) {
      const day = $(elements[k]).find('td:eq(0)').text().trim();
      const content = $(elements[k]).find('td:eq(1)').text().trim();
      const hexadecimalColorCode = $(elements[k]).attr('style')?.split(':')[1]?.trim();
      const color = colorMap.get(hexadecimalColorCode);
      const weatherInfo = `${day}; ${content}; Color: ${color}`;
      const extraDataText = {
        Title: title, 'Date of Issue': dateText, Day: day, 'Corresponding table content': content, 'Color of entry': color,
      };
      if (day !== '') {
        posts.push(
          new Post({
            text: weatherInfo,
            postUrl: url,
            postedAt: timestamp,
            extraData: extraDataText,
          }),
        );
      }
    }
    j = 9;
    l += 9;
  }
  return posts;
}

export const parser = new LiteParser('India Meteorological Department', baseURL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['body #middle table tbody tr'],
    parser: postHandler,
    name: 'post',
  },
]);
