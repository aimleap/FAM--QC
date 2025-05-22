import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { URL_PLACE_HOLDER } from '../../../../constants/url';
import { initializeDDWDomainsCache, shouldInitializeCache } from '../../../../lib/api/mdsManager';
import logger from '../../../../lib/logger';
import { getContext } from '../../../../lib/logging/context';

export const source: SourceType = {
  description: 'DIP Cron Job',
  isCloudFlare: false,
  name: 'Source Channel API',
  type: SourceTypeEnum.FORUM,
  url: URL_PLACE_HOLDER,
  expireIn: 45,
};

async function refresh(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  _forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
) {
  if (await shouldInitializeCache()) {
    logger.info('DIP is refreshing source channel cache', getContext(0, url));
    await initializeDDWDomainsCache();
  } else {
    logger.info('No need to refresh source channel cache', getContext(0, url));
  }

  return [];
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'refresh',
      selector: ['*'],
      handler: refresh,
    },
  ],
  2,
);
