import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.drivebc.ca/api/events?format=rss';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((element) => {
    const $el = $($(element).toString().replaceAll('dbc:', '').replaceAll('geo:', ''));
    const publishedDate = $el.find('pubdate').text().split('-')[0].trim();
    const title = $el.find('title').text();
    const link = $el.find('guid').text();
    const description = $el.find('description').text();
    const category = $el.find('category').text();
    const dbcDistrict = $el.find('district').text();
    const dbcRoute = $el.find('route').text();
    const dbcType = $el.find('type').text();
    const dbcSeverity = $el.find('severity').text();
    const geoLat = $el.find('lat').text();
    const geoLong = $el.find('long').text();
    const latLong = `${geoLat}, ${geoLong}`;
    const timestamp = moment(publishedDate, 'ddd, DD MMM YYYY hh:mm:ss').unix();
    const ententInfo = `${dbcRoute} ; ${category} ; ${dbcType} ; ${dbcSeverity}`;
    const extraDataInfo = {
      title,
      link,
      description,
      category,
      dbcDistrict,
      dbcRoute,
      dbcType,
      dbcSeverity,
      geoLat,
      geoLong,
      LATLONG: latLong,
      publishedDate,
    };
    if (moment(publishedDate, 'ddd, DD MMM YYYY hh:mm:ss').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: ententInfo,
          postUrl: link,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Drive BC', baseURL, [
  {
    selector: ['channel item'],
    parser: postHandler,
  },
]);
