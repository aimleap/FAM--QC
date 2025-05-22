import { SourceType, SourceTypeEnum, ThreadType } from './parserUtil';
import { TikTokQuery, TikTokRequestParams, buildThreads } from './tiktokUtils';

const tikTokQueryParams: TikTokRequestParams = {
  WebIdLastTime: '1717622887',
  aid: '1988',
  app_language: 'en',
  app_name: 'tiktok_web',
  browser_language: 'en-GB',
  browser_name: 'Mozilla',
  browser_online: 'true',
  browser_platform: 'MacIntel',
  browser_version: '123',
  channel: 'tiktok_web',
  cookie_enabled: 'true',
  count: '15',
  device_id: '123',
  device_platform: 'web_pc',
  focus_state: 'false',
  from_page: 'from_page_placeholder',
  history_len: '100',
  is_fullscreen: 'false',
  is_page_visible: 'true',
  offset: '0',
  os: 'mac',
  priority_region: 'US',
  region: 'DE',
  screen_height: '1117',
  screen_width: '1728',
  tz_name: 'Europe/Berlin',
  verifyFp: '123',
  webcast_language: 'en',
  msToken: '234',
  'X-Bogus': '567',
  _signature: '8910',
};

const source: SourceType = {
  description: 'Unittest Tiktok',
  name: 'TikTok',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.tiktok.com',
  entryUrl: '/node/common/cookies-await-consent',
};

const searches: TikTokQuery[] = [
  {
    url: 'https://www.tiktok.com/api/search/item/full/?',
    type: 'keywordSearch',
    isEnabled: true,
    searchId: '2',
    keyword: 'test',
    pages: 1,
  },
  {
    url: 'https://www.tiktok.com/api/recommend/item_list/?',
    type: 'forYou',
    isEnabled: true,
    searchId: '',
    keyword: '',
    pages: 1,
  },
];

describe('Testing TikTok Utils', () => {
  describe('Testing query url generation', () => {
    it('should build correct keyword search query', () => {
      const threads: ThreadType[] = buildThreads(source, searches, tikTokQueryParams);
      expect(threads.at(0)?.link).toStrictEqual(
        'https://www.tiktok.com/api/search/item/full/?WebIdLastTime=1717622887&aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-GB&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=123&channel=tiktok_web&cookie_enabled=true&count=15&device_id=123&device_platform=web_pc&focus_state=false&from_page=search&history_len=100&is_fullscreen=false&is_page_visible=true&offset=12&os=mac&priority_region=US&region=DE&screen_height=1117&screen_width=1728&tz_name=Europe%2FBerlin&verifyFp=123&webcast_language=en&msToken=234&X-Bogus=567&_signature=8910&search_id=2&keyword=test',
      );
    });
    it('should build correct for you page query', () => {
      const threads: ThreadType[] = buildThreads(source, searches, tikTokQueryParams);
      expect(threads.at(1)?.link).toStrictEqual(
        'https://www.tiktok.com/api/recommend/item_list/?WebIdLastTime=1717622887&aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-GB&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=123&channel=tiktok_web&cookie_enabled=true&count=15&device_id=123&device_platform=web_pc&focus_state=false&from_page=fyp&history_len=100&is_fullscreen=false&is_page_visible=true&offset=12&os=mac&priority_region=US&region=DE&screen_height=1117&screen_width=1728&tz_name=Europe%2FBerlin&verifyFp=123&webcast_language=en&msToken=234&X-Bogus=567&_signature=8910',
      );
    });
  });
});
