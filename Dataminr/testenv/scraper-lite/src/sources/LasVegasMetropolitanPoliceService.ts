import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.lvmpd.com/en-us/Pages/Press-Releases.aspx';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('td:eq(1)').text().trim();
    const releaseDate = $(el).find('td:eq(2)').text().trim();
    const document = $(el).find('td:eq(3)').text().trim();
    const releaseType = $(el).find('td:eq(4)').text().trim();
    let location = '';
    if (releaseType === 'Traffic') {
      location = title.split('/')[1].trim();
    }
    const timestamp = moment(releaseDate, 'MM/DD/YYYY').unix();
    const pressRealseInfo = `${title} ; ${location} ; ${releaseDate} ; ${document} ; ${releaseType}`;
    const extraDataInfo = {
      Title: title,
      Location: location,
      'Release Date': releaseDate,
      Document: document,
      'Release Type': releaseType,
    };
    if (moment(releaseDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: pressRealseInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Las Vegas Metropolitan Police Service', baseURL, [
  {
    selector: ['table[summary^=PressReleases] tbody tr:not(:has(th))'],
    parser: postHandler,
    name: 'post',
  },
]);
