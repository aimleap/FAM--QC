import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://dnbstatus.no/incidents?';

const baseURLPrefix = 'https://n3pkrn6d6qtk.statuspage.io';
const baseURLSuffix = '/api/v2/incidents.json';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const jsonObj = JSON.parse(response.body);
  const jsonArray = jsonObj.incidents;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.started_at;
    const dateText = date.split('T')[0];
    if (moment(dateText, 'YYYY-MM-DD').isSame(moment(), 'day')) {
      const incidentTitle = jObj.name;
      const title = incidentTitle.split('issues with')[1].trim();
      const incidentAffected = jObj.components[0].name;
      const incidentStarted = (jObj.created_at).split('.')[0];
      const startedDateTime = `${incidentStarted.split('T')[0]} ${incidentStarted.split('T')[1]}`;
      const incidentResolved = (jObj.created_at).split('.')[0];
      const resolvedDateTime = `${incidentResolved.split('T')[0]} ${incidentResolved.split('T')[1]}`;
      const timestamp = moment(dateText, 'YYYY-MM-DD').unix();
      const textInfo = `Incident: ${title}, Incident Affected: ${incidentAffected}, Incident Started: ${startedDateTime}, Incident Resolved: ${resolvedDateTime}`;
      const extraDataInfo = {
        title,
        affected: incidentAffected,
        started: startedDateTime,
        resolved: resolvedDateTime,
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
  'DNB Status',
  baseURLPrefix,
  [
    {
      selector: ['*'],
      parser: postHandler,
    },
  ],
  baseURLSuffix,
);
