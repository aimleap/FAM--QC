import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const API_DOMAIN_URL = 'https://wahis.woah.org';
interface WorldOrganizationForAnimalHealth{
  country: string;
  reportNumber: string;
  reportType: string;
  disease: string;
  subType: string;
  reason: string;
  eventStartDate: string;
  submissionDate: string;
  eventId: string;
}

async function postHandler(): Promise<Post[]> {
  const posts: Post[] = [];
  const options = {
    method: 'POST',
    uri: appendLink(
      API_DOMAIN_URL,
      '/api/v1/pi/event/filtered-list?language=en',
    ),
    body: '{"eventIds":[],"reportIds":[],"countries":[],"firstDiseases":[],"secondDiseases":[],"typeStatuses":[],"reasons":[],"eventStatuses":[],"reportTypes":[],"reportStatuses":[],"eventStartDate":null,"submissionDate":null,"animalTypes":[],"sortColumn":"submissionDate","sortOrder":"desc","pageSize":100,"pageNumber":0}',
    headers: {
      'Content-Type': 'application/json',
    },
    resolveWithFullResponse: true,
  };

  const baseURL = 'https://wahis.woah.org/#/event-management';
  const response = await request(options);
  if (response.statusCode !== 200) return [];
  const responseText = JSON.parse(response.body);
  const jsonArray: WorldOrganizationForAnimalHealth[] = responseText.list;
  jsonArray.forEach((jObj: any) => {
    const reportDate = jObj.submissionDate.split('T')[0];
    const formattedReportDate = moment(reportDate, 'YYYY-MM-DD').format('YYYY/MM/DD');
    if (moment(formattedReportDate, 'YYYY/MM/DD').isSame(moment(), 'day')) {
      const { country } = jObj;
      const { disease } = jObj;
      const subType = jObj.subType == null ? '' : jObj.subType;
      const reportNumber = `${jObj.reportType}_${jObj.reportNumber}`;
      const { reason } = jObj;
      const startDate = jObj.eventStartDate.split('T')[0];
      const formattedStartDate = moment(startDate, 'YYYY-MM-DD').format('YYYY/MM/DD');
      const sourceLink = `https://wahis.woah.org/#/in-event/${jObj.eventId}/dashboard`;
      const timestamp = moment(formattedReportDate, 'YYYY/MM/DD').unix();
      const articleInfo = `${country} ; ${reportNumber} ; ${disease} ; ${subType} ; ${reason} ; ${formattedStartDate} ; ${formattedReportDate}`;
      const extraDataInfo = {
        Country: country,
        'Report number': reportNumber,
        Disease: disease,
        'Genotype/ Serotype/ Subtype': subType,
        Reason: reason,
        'Start Date': formattedStartDate,
        'Report Date': formattedReportDate,
        'Source Link': sourceLink,
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: baseURL,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('World Organization for Animal Health', API_DOMAIN_URL, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
