import {
  buildUrl, DouyinKeywordSearchConfig, DouyinSearch, DouyinUserConfig,
} from './douyinUtils';

describe('Testing Douyin utils', () => {
  describe('Testing url builder', () => {
    it('It should pass', () => {
      const data: DouyinSearch = { input: '火灾', type: 'keyword' };
      const keywordUrl = 'https://www.douyin.com/aweme/v1/web/search/item/?device_platform=webapp&aid=6383&channel=channel_pc_web&search_channel=aweme_video_web&sort_type=0&publish_time=<START_TIME>&keyword=<SEARCH_KEY>&search_source=tab_search&query_correct_type=1&is_filter_search=1&from_group_id=&offset=<OFFSET>&count=<POST_COUNT>&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=en-GB&browser_platform=MacIntel&browser_name=Chrome&browser_version=114.0.0.0&browser_online=true&engine_name=Blink&engine_version=114.0.0.0&os_name=Mac+OS&os_version=10.15.7&cpu_core_num=10&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7250082718783014434&msToken=<MS_TOKEN>';
      const userUrl = 'https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=<USER_ID>&max_cursor=<MAX_CURSOR>&locate_query=false&show_live_replay_strategy=1&count=<POST_COUNT>&publish_video_strategy_type=2&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=en-GB&browser_platform=MacIntel&browser_name=Chrome&browser_version=114.0.0.0&browser_online=true&engine_name=Blink&engine_version=114.0.0.0&os_name=Mac+OS&os_version=10.15.7&cpu_core_num=10&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7250082718783014434&msToken=<MS_TOKEN>';
      const userData: DouyinUserConfig = {
        url: userUrl,
        cookie: 'blah',
        msToken: 'bleh',
        postCount: '0',
        maxCursor: '10',
        searchData: [data],
      };
      const keywordSearchData: DouyinKeywordSearchConfig = {
        url: keywordUrl,
        cookie: 'keyword-blah',
        msToken: 'keyword-blah',
        postCount: '10',
        offset: '0',
        startTime: 0,
        searchData: [data],
      };
      const url = buildUrl(data, userData, keywordSearchData);
      expect(url).toStrictEqual(
        'https://www.douyin.com/aweme/v1/web/search/item/?device_platform=webapp&aid=6383&channel=channel_pc_web&search_channel=aweme_video_web&sort_type=0&publish_time=0&keyword=%E7%81%AB%E7%81%BE&search_source=tab_search&query_correct_type=1&is_filter_search=1&from_group_id=&offset=0&count=10&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1728&screen_height=1117&browser_language=en-GB&browser_platform=MacIntel&browser_name=Chrome&browser_version=114.0.0.0&browser_online=true&engine_name=Blink&engine_version=114.0.0.0&os_name=Mac+OS&os_version=10.15.7&cpu_core_num=10&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7250082718783014434&msToken=keyword-blah',
      );
    });
  });
});
