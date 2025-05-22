import { Response } from 'request';
import moment from 'moment';
import crypto from 'node:crypto';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

const baseURL = 'https://prociv-portal.geomai.mai.gov.pt/arcgis/apps/experiencebuilder/experience/?id=29e83f11f7a34339b35364e483e3846f/';
const dataURL = 'https://prociv-agserver.geomai.mai.gov.pt/arcgis/rest/services/Ocorrencias_Base/FeatureServer/0/query?f=json&cacheHint=true&resultOffset=0&resultRecordCount=100&where=1%3D1&orderByFields=DataOcorrencia%20DESC&outFields=*&resultType=standard&returnGeometry=false&spatialRel=esriSpatialRelIntersects';

async function threadHandler(): Promise<Thread[]> {
  const threads: Thread[] = [];
  threads.push({
    link: dataURL,
    title: 'headline',
    parserName: 'post',
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseURL) return posts;
  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.features;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.attributes.DataInicioOcorrencia;
    const dateText = date.split('T')[0];
    if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const title = jObj.attributes.Natureza;
      const location11 = jObj.attributes.Freguesia;
      const location12 = jObj.attributes.Localidade;
      const location21 = jObj.attributes.CSREPC;
      const location22 = jObj.attributes.Concelho;
      const personnel = jObj.attributes.Operacionais;
      const emergencyVehicles = jObj.attributes.NumeroMeiosTerrestresEnvolvidos;
      const emergencyAircraft = jObj.attributes.NumeroMeiosAereosEnvolvidos;
      const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
      const textInfo = `${title} ; ${location11}, ${location12} ; ${location21}, ${location22}`;
      const extraDataInfo = {
        Title: title,
        'Location 1': `${location11}, ${location12}`,
        'Location 2': `${location21}, ${location22}`,
        Personnel: personnel,
        'Emergency Vehicles': emergencyVehicles,
        'Emergency Aircraft': emergencyAircraft,
      };
      posts.push(
        new Post({
          text: textInfo,
          postUrl: baseURL,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}
export const parser = new LiteParser(
  'Portugal ANEPC',
  baseURL,
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '',
  {
    // @ts-ignore
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  },
);
