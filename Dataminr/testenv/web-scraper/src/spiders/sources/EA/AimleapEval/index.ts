import moment from 'moment';
import { Response } from 'request';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import {
  parseConfig,
  parseExtraData,
  excludeUser,
  generatePost,
  getAPIContent,
  AimLeapResponse,
  AimLeapSourceConfig,
} from '../../../../lib/aimLeapUtils';
import Post from '../../../../schema/post';

import AuthParser from '../../../parsers/AuthParser';
import { getLatestConfig } from '../../../../lib/cacheUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { WEIBO_CONFIG_UI_KEY, WeiboConfig } from '../../../../lib/weibo/weiboUtil';

export const source: SourceType = {
  description: 'AimLeap Trial',
  isCloudFlare: false,
  name: 'AimLeap',
  type: SourceTypeEnum.FORUM,
  url: 'https://outsourcingserviceprovider.in/api/dmp',
  entryUrl: '/users/me/',
  requestOption: {
    forceTor: 'true',
  },
  expireIn: 200,
};

const BACKFILLED_MINUTES = 1440;

async function threadHandler(): Promise<ThreadType[]> {
  const now = moment().unix();
  // checking for the scraped data in the past 2 hours
  const startTime = moment.utc().subtract(2, 'h').format('YYYY-MM-DD HH:mm');
  const endTime = moment.utc().format('YYYY-MM-DD HH:mm');

  const config: AimLeapSourceConfig | null = {
    sources: {},
    password: '',
    ...(await getLatestConfig(source.name)),
  };
  if (config.sources === null || Object.keys(config.sources).length === 0) return [];
  const sources = Object.keys(config.sources);
  return sources.map((src) => ({
    title: src,
    link: encodeURI(
      `https://outsourcingserviceprovider.in/api/dmp/${src}/?datetime_of_scrap_from=${startTime}&datetime_of_scrap_to=${endTime}`,
    ),
    timestamp: now,
    parserName: 'post',
    requestOption: {
      headers: { Authorization: `Bearer ${config.password}` },
    },
  }));
}

async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  _url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const config: AimLeapSourceConfig | null = {
    sources: {},
    password: '',
    ...(await getLatestConfig(source.name)),
  };
  const weiboPages: WeiboConfig | null = {
    static_token: '',
    searches: [{ type: '', uid: '', pages: '' }],
    cookies: [{ token: '' }],
    ...(await getLatestConfig(WEIBO_CONFIG_UI_KEY)),
  };
  const weiboUserIds = weiboPages.searches.map((search) => search.uid);
  const result = getAPIContent(response);

  if (result === null) return [];

  result.map((item: AimLeapResponse) => {
    try {
      const extraData = parseExtraData(item.extradata);
      const mapTransformed = parseConfig(extraData, config.sources, forumPaths[0]);
      if (item.url === '' || item.text === '' || mapTransformed === null) return [];
      /**
       * do not ingest Weibo post if the message userID
       * exists in the list of accounts handled by Weibo parser.
       * This is to ensure we do not alert on duplicate content
       */
      if (forumPaths[0] === 'Weibo Search' && excludeUser(extraData.account_id, weiboUserIds)) return [];
      mapTransformed
        .set('sourceName', forumPaths[0])
        .set('dataProvider', source.name)
        .set('contentType', item.content)
        .set('parser_type', PARSER_TYPE.AIMLEAP_PARSER);
      return posts.push(generatePost(item, forumPaths, mapTransformed));
    } catch (e) {
      return [];
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'entry',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  BACKFILLED_MINUTES,
);
