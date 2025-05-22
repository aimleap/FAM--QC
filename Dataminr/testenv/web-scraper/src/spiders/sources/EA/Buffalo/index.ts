import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import AuthParser from '../../../parsers/AuthParser';
import { appendLink, SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import post from '../../../../schema/post';

import { getAjaxRows, getPosts } from '../../../frameworks/P2C';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Buffalo & Kearny County 911',
  type: SourceTypeEnum.FORUM,
  url: 'https://p2c.kearneygov.org/',
};

const BACKFILLED_MINUTE = 70;

async function postHandler(): Promise<post[]> {
  const currentUrl = appendLink(source, 'cad/callsnapshot.aspx');
  const rows = await getAjaxRows(
    appendLink(source, 'cad/cadHandler.ashx?op=s'),
    {},
    BACKFILLED_MINUTE,
  );
  return getPosts(rows, TIME_ZONE['US/Central'], currentUrl, (address) => `${address}, NE`);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  BACKFILLED_MINUTE,
);
