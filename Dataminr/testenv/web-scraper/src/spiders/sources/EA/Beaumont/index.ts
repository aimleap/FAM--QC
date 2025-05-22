import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import AuthParser from '../../../parsers/AuthParser';
import { appendLink, SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import post from '../../../../schema/post';

import { getAjaxRows, getPosts } from '../../../frameworks/P2C';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Beaumont Police & Fire 911',
  type: SourceTypeEnum.FORUM,
  url: 'https://p2c.beaumonttexas.gov',
};

const BACKFILLED_MINUTE = 35;

async function postHandler(): Promise<post[]> {
  const currentUrl = appendLink(source, 'p2c/cad/currentcalls.aspx');
  const rows = await getAjaxRows(
    appendLink(source, 'p2c/cad/cadHandler.ashx?op=s'),
    {},
    BACKFILLED_MINUTE,
  );
  return getPosts(rows, TIME_ZONE['US/Central'], currentUrl, (address) => `${address}, TX`);
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
