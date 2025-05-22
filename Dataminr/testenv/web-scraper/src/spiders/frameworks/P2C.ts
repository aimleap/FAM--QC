import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { getResponse } from '../../lib/crawler';
import post from '../../schema/post';
import { toPost } from '../../lib/911ScraperUtil';

type getAddressCallback = (address: string) => string;

export async function getAjaxRows(
  url: string,
  formData: object = {},
  backfilledMinute: number = 0,
): Promise<any[]> {
  const response = await getResponse({
    method: 'POST',
    url,
    // @ts-ignore
    formData: {
      t: 'css',
      _search: 'false',
      nd: moment().subtract(backfilledMinute, 'minute').unix() * 1000,
      rows: 100,
      page: 1,
      sidx: 'starttime',
      sord: 'desc',
      ...formData,
    },
  });

  if (response.statusCode !== 200) return [];

  const data = JSON.parse(response.body);
  const { rows } = data;

  if (rows === null || rows.length === 0) return [];

  return rows;
}

export function getPosts(
  rows: any[],
  timeZone: string,
  postUrl: string,
  getAddress: getAddressCallback,
): post[] {
  // @ts-ignore
  return rows
    .map(({
      address, id: incidentId, nature: incidentType, starttime: startTime,
    }) => {
      if (address === undefined || incidentType.trim().search(/&nbsp;/) !== -1) return null;

      const transformedAddress = typeof getAddress === 'function' ? getAddress(address) : address;
      const headline = `${incidentType.trim()} at ${transformedAddress}`;
      const timestamp = adjustTimezone(
        moment.utc(startTime, 'M/DD/YYYY H:mm:ss A').format('YYYY-MM-DD hh:mm A'),
        timeZone,
      );
      return toPost(
        headline.trim(),
        transformedAddress.trim(),
        incidentType.trim(),
        incidentId.trim(),
        timestamp,
        postUrl,
      );
    })
    .filter((x) => x !== null);
}
