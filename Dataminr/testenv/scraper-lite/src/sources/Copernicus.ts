import moment from 'moment';
import { Response } from 'request';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const jsonApiURL = 'https://api2.wild-fire.eu/firenews/rest/firenews/firenews?notify=1&ordering=-enddate,-startdate&limit=10&offset=0';
const countryMap = new Map([
  ['AT', 'Austria'],
  ['BE', 'Belgium'],
  ['BG', 'Bulgaria'],
  ['HR', 'Croatia'],
  ['CY', 'Cyprus'],
  ['CZ', 'Czech Republic'],
  ['DK', 'Denmark'],
  ['EE', 'Estonia'],
  ['FI ', 'Finland'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['GR', 'Greece'],
  ['HU', 'Hungary'],
  ['IE', 'Ireland'],
  ['IT', 'Italy'],
  ['LV', 'Latvia'],
  ['LT', 'Lithuania'],
  ['LU', 'Luxembourg'],
  ['MT', 'Malta'],
  ['NL', 'Netherlands'],
  ['PL', 'Poland'],
  ['PT', 'Portugal'],
  ['RO', 'Romania'],
  ['SK', 'Slovakia'],
  ['SI', 'Slovenia'],
  ['ES', 'Spain'],
  ['SE', 'Sweden'],
  ['AL', 'Albania'],
  ['AD', 'Andorra'],
  ['AM', 'Armenia'],
  ['BY', 'Belarus'],
  ['BA', 'Bosnia and Herzegovina'],
  ['FO', 'Faroe Islands'],
  ['GE', 'Georgia'],
  ['GI', 'Gibraltar'],
  ['IS', 'Iceland'],
  ['IM', 'Isle of Man'],
  ['XK', 'Kosovo'],
  ['LI', 'Liechtenstein'],
  ['MK', 'Macedonia'],
  ['MD', 'Moldova'],
  ['MC', 'Monaco'],
  ['ME', 'Montenegro'],
  ['NO', 'Norway'],
  ['RU', 'Russian Federation'],
  ['SM', 'San Marino'],
  ['RS', 'Serbia'],
  ['CH', 'Switzerland'],
  ['TR', 'Turkey'],
  ['UA', 'Ukraine'],
  ['GB', 'United Kingdom'],
  ['VA', 'Vatican City State'],
]);
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];

  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.results;
  jsonArray.forEach((jObj: any) => {
    const startdate = jObj.startdate.split('T')[0];
    if (moment(startdate, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const areaHa = `${jObj.area_ha} ha`;
      const simpleplace = `[${jObj.simpleplace}]`;
      const { place } = jObj;
      const enddate = jObj.enddate.split('T')[0];
      const country = countryMap.get(`${jObj.simpleplace}`);
      const postUrl = 'https://effis.jrc.ec.europa.eu/apps/firenews.viewer/';
      const timestamp = moment(startdate, 'YYYY-MM-DD').unix();
      const title = `${simpleplace} - ${country} / ${place}`;
      const date = `${startdate} - ${enddate}`;
      const articleInfo = `${title}; ${areaHa} ; ${date}`;
      const extraDataText = {
        Title: title, Description: areaHa, Date: date, Location: title,
      };

      posts.push(
        new Post({
          text: articleInfo,
          postUrl,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Copernicus', jsonApiURL, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
