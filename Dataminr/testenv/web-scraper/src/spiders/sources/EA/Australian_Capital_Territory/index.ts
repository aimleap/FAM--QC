import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ConvertCase } from '../../../../lib/parserUtil';
import post from '../../../../schema/post';

import { getResponse } from '../../../../lib/crawler';
import Incident from '../../../../schema/incident';
import { incidentToPost, jsonToPost, getIncident } from '../../../../lib/911ScraperUtil';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Australian Capital Territory Emergency',
  type: SourceTypeEnum.FORUM,
  url: 'https://esa.act.gov.au/?fullmap=true',
};
const BACKFILLED_MINUTES = 60;

export function getHeadline(incidentType: string, status: string, location: string) {
  try {
    if (incidentType !== undefined) {
      return `${incidentType} at ${location.trim()}, Australia`
        .replace('  ', ' ')
        .replace('\n', '')
        .replace('N/A', '')
        .trim()
        .replace(/\s\s+/g, ' ');
    }
    return null;
  } catch (e) {
    return null;
  }
}
async function handler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<post[]> {
  const posts: post[] = [];
  // @ts-ignore
  const requestUrl = encodeURI('https://esa.act.gov.au/act-gov-esa/incidents/feed');

  // @ts-ignore
  const response = await getResponse({ url: requestUrl }, source.isCloudFlare, source.name);
  const data = JSON.parse(response.body);

  if (data.length === 0) return [];

  // @ts-ignore
  data.forEach((incident) => {
    const message = jsonToPost(
      incident,
      'location',
      'type',
      'time_of_call',
      '',
      'status',
      '',
      '',
      'id',
    );

    let location = ConvertCase(message.location);

    // Add the state if it's missing
    const parts = ConvertCase(message.location).split(',');
    if (parts.length > 1) {
      let lastPart = parts[parts.length - 1];
      lastPart = lastPart.replace(/ [0-9]{4,}/, '');
      const results = lastPart.match(/ [A-Za-z]{3,}/);
      const state = results !== null ? ` ${results[0]}` : '';
      parts[parts.length - 1] = state.toUpperCase();
      location = parts.join(',').replace(/,$/, '').replace('  ', ' ');
    }
    const datetime = moment
      .utc(message.timestamp, 'DD MMM YYYY HH:mm:SS')
      .format('YYYY-MM-DD hh:mm A');
    const timestamp = adjustTimezone(datetime, TIME_ZONE['Australia/Sydney']);

    const headline = getHeadline(getIncident(message.incidentType), message.status, location);
    if (!location || headline == null) {
      return;
    }
    const incidentData = new Incident({
      compositeText: headline.replace(' ACT', ', ACT').replace(',,', '').trim(),
      compositeLocation: `${location}, Australia`,
      location,
      status: message.status,
      incidentType: getIncident(message.incidentType),
      incidentId: message.id!,
      timestamp,
      url,
    });
    posts.push(incidentToPost(incidentData));
  });

  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'parse',
      selector: ['body'],
      handler,
    },
  ],
  BACKFILLED_MINUTES,
);
