import { Response } from 'request';
import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURLPrefix = 'https://status.cloud.com';
const baseURLSuffix = '/api/maintenances';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body;
  const jsonObj = JSON.parse(responseText);
  const responseCountry = await request({
    method: 'GET',
    url: 'https://status.cloud.com/api/connected_hub_services',
    resolveWithFullResponse: true,
  });
  const countryJsonArray = JSON.parse(responseCountry.body);
  jsonObj.forEach((jObj: any) => {
    const dateTimestamp = jObj.timestamp_start;
    const newsDateText = new Date(dateTimestamp * 1000).toLocaleString();
    if (moment(newsDateText, 'DD/MM/YYYY hh:mm:ss').isSame(moment(), 'day')) {
      const { title } = jObj;
      const text = $(jObj.message).text();
      const groupName = jObj.services[0].group_name;
      const maintenanceID = jObj.services[0].maintenance_id;
      const serviceID = jObj.services[0].service_id;
      let countryName = '';
      countryJsonArray.forEach((jObj1: any) => {
        const serviceIDArr = jObj1.service_ids;
        if (serviceIDArr.includes(serviceID)) {
          countryName = jObj1.name;
        }
      });
      const serviceName = jObj.services[0].service_name;
      const timestamp = dateTimestamp;
      const articleInfo = `${serviceID} ; ${title} ; ${text} ; ${groupName} ; ${maintenanceID} ; ${serviceName} ; ${newsDateText} ; ${countryName}`;
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: baseURLPrefix,
          postedAt: timestamp,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Citrix Cloud Health',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
