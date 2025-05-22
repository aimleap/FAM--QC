import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import AuthParser from '../../../parsers/AuthParser';
import { ConvertCase, SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import post from '../../../../schema/post';

import { incidentToPost } from '../../../../lib/911ScraperUtil';
import Incident from '../../../../schema/incident';
import Logger from '../../../../lib/logger';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Arlington Police Department',
  type: SourceTypeEnum.FORUM,
  url: 'https://arlingtonpd.org/webapps/policeincidents/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<post[]> {
  const posts: post[] = [];

  elements.forEach((el) => {
    try {
      const tds = $(el).find('td');
      const date = moment($(tds[4]).text(), 'M/DD/YYYY');
      const time = moment($(tds[5]).text(), 'HH:mm:ss');
      const timestamp = adjustTimezone(
        `${date.format('YYYY-MM-DD')} ${time.format('hh:mm A')}`,
        TIME_ZONE['US/Central'],
      );
      const incidentType = ConvertCase($(tds[0]).text().replace('**', '')).trim();
      const location = ConvertCase($(tds[7]).text()).trim();
      const crossStreet = '';
      const incidentId = ConvertCase($(tds[6]).text()).trim();
      const headline = `${incidentType} at ${location}, Arlington, TX`;
      const { url } = source;
      const county = 'Tarrant County';
      const state = 'TX';
      const country = '';
      const troop = '';
      const status = '';

      if (!location) {
        return;
      }

      const incidentData = new Incident({
        compositeText: headline,
        compositeLocation: `${location}`,
        location,
        crossStreet,
        county,
        country,
        state,
        incidentType,
        incidentId,
        status,
        responder: troop,
        timestamp,
        url,
      });

      posts.push(incidentToPost(incidentData));
    } catch (e) {
      Logger.info(`parse error: ${source.url} `, e);
    }
  });

  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['tbody > tr'],
      handler: postHandler,
    },
  ],
  60,
);
