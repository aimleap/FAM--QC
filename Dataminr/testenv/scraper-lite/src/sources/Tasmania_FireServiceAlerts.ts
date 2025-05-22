import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseUrl = 'https://alert.tas.gov.au/?list=incidents&id=48c7e696-7205-4306-9689-f1b9725e9d66';

const baseURLPrefix = 'https://alert.tas.gov.au';
const baseURLSuffix = '/data/data.geojson';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.features;
  jsonArray.forEach((jObj: any) => {
    const newsDate = jObj.properties.created;
    const newsDateText = newsDate.split('+')[0].trim();
    const newsDateFormatted = `${newsDateText.split('T')[0]} ${newsDateText.split('T')[1]}`;
    if (moment(newsDateFormatted, 'YYYY-MM-DD hh:mm:ss').isSame(moment(), 'day')) {
      const event = jObj.properties.type.name;
      const location = jObj.properties.address;
      const timestamp = moment(newsDateText, 'YYYY-MM-DD hh:mm:ss').unix();
      const articleInfo = `${newsDateFormatted} ; ${event}`;
      const extraDataInfo = {
        discussion_title: location,
      };

      posts.push(
        new Post({
          text: articleInfo,
          postUrl: baseUrl,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });

  return posts;
}

export const parser = new LiteParser(
  'Tasmania Fire Service Alerts',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
