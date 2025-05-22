import moment from 'moment';
import querystring from 'querystring';
import { SourceType, ThreadType } from './parserUtil';
import { random } from './crawler';

export interface TikTokAuthor {
  uniqueId: string;
}

export interface TikTokVideo {
  downloadAddr: string;
  cover: string;
}

export interface TikTokItems {
  id: string;
  author: TikTokAuthor;
  desc: string;
  createTime: number;
  video: TikTokVideo;
}

export interface TikTokResponse {
  item_list: TikTokItems[];
  itemList: TikTokItems[];
}

export interface TikTokQuery {
  url: string;
  type: string;
  isEnabled: boolean;
  searchId: string;
  keyword: string;
  pages: number;
}

export interface TikTokRequestParams {
  WebIdLastTime: string;
  aid: string;
  app_language: string;
  app_name: string;
  browser_language: string;
  browser_name: string;
  browser_online: string;
  browser_platform: string;
  browser_version: string;
  channel: string;
  cookie_enabled: string;
  count: string;
  device_id: string;
  device_platform: string;
  focus_state: string;
  from_page: string;
  history_len: string;
  is_fullscreen: string;
  is_page_visible: string;
  os: string;
  priority_region: string;
  region: string;
  screen_height: string;
  screen_width: string;
  tz_name: string;
  verifyFp: string;
  msToken: string;
  'X-Bogus': string;
  _signature: string;
  webcast_language: string;
  offset: string;
}
export interface TikTokConfig {
  shared_parameters: TikTokRequestParams;
  data: TikTokQuery[];
}

export interface message {
  text: string;
  timestamp: number;
  url: string;
  author: string;
  authorUrl: string;
}

export function getOffsets(count: number): number[] {
  return [...Array(count).keys()].map((_, x) => 12 * (x + 1));
}

export function buildThreads(
  source: SourceType,
  searches: TikTokQuery[],
  params: TikTokRequestParams,
): ThreadType[] {
  const threads: ThreadType[] = [];
  searches.forEach((search) => {
    const pageScrolls = getOffsets(search.pages);
    if (search.type === 'forYou' && search.isEnabled) {
      pageScrolls.forEach((offset) => {
        threads.push({
          title: `${source.name}-${search.type}-${offset}`,
          // @ts-ignore
          link: `${search.url}${querystring.stringify(params)}`
            .replace('offset=0', `offset=${offset}`)
            .replace('from_page=from_page_placeholder', 'from_page=fyp'),
          timestamp: moment().unix(),
          parserName: 'post',
          delay: random(10, 20) * 1000,
        });
      });
    }
    if (search.type === 'keywordSearch' && search.isEnabled) {
      pageScrolls.forEach((offset) => {
        const dynamicParams = `&search_id=${search.searchId}&keyword=${search.keyword
          .split(' ')
          .join('+')}`;
        threads.push({
          title: `${source.name}-${search.type}-${offset}`,
          // @ts-ignore
          link: `${search.url}${querystring.stringify(params)}${dynamicParams}`
            .replace('offset=0', `offset=${offset}`)
            .replace('from_page=from_page_placeholder', 'from_page=search'),
          timestamp: moment().unix(),
          parserName: 'post',
          delay: random(10, 20) * 1000,
        });
      });
    }
  });
  return threads;
}
