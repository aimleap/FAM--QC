import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrlPrefix = 'https://seattlecitygis.maps.arcgis.com';

const JSON_URL = 'https://utility.arcgis.com/usrsvcs/servers/252ba266228a44e0b7df1fac6583770e/rest/services/SPD_SECURE/911IncidentResponses_20220217/MapServer/0/query?f=json&geometry=%7B%22xmin%22%3A-13619243.951738995%2C%22ymin%22%3A6026906.806230988%2C%22xmax%22%3A-13540972.434774995%2C%22ymax%22%3A6105178.32319499%7D&orderByFields=caseID&outFields=*&outSR=102100&quantizationParameters=%7B%22extent%22%3A%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-13619243.951738995%2C%22ymin%22%3A6026906.806230988%2C%22xmax%22%3A-13540972.434774995%2C%22ymax%22%3A6105178.32319499%7D%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A152.87405657031263%7D&inSR=102100';

async function postHandler(): Promise<Post[]> {
  const response = await request({
    method: 'GET',
    url: JSON_URL,
    resolveWithFullResponse: true,
  });

  const json = JSON.parse(response.body);

  if (!json || !json.features) return [];

  return json.features.map((x: any) => {
    const timestamp = moment.unix(x.attributes.calldatetime / 1000);
    const type = x.attributes.calltype;
    const location = x.attributes.addressblock;
    const articleInfo = `${type} at ${location}, Seattle, WA`;
    return new Post({
      text: articleInfo,
      postedAt: timestamp.unix(),
      postUrl:
        'https://seattlecitygis.maps.arcgis.com/apps/MapSeries/index.html?appid=94c31b66facc438b95d95a6cb6a0ff2e',
    });
  });
}

export const parser = new LiteParser('Seattle Police Dept', baseUrlPrefix, [
  {
    selector: ['*'],
    parser: postHandler,
  },
]);
