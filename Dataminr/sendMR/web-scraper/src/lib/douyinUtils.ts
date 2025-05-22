import { Response } from 'request';
import Logger from './logger';

export interface DouyinSearch {
  input: string;
  type: string;
}

export interface DouyinUserConfig {
  url: string;
  cookie: string;
  msToken: string;
  postCount: string;
  maxCursor: string;
  searchData: DouyinSearch[];
}

export interface DouyinKeywordSearchConfig {
  url: string;
  cookie: string;
  msToken: string;
  offset: string;
  postCount: string;
  startTime: number;
  searchData: DouyinSearch[];
}

export interface DouyinConfigUI {
  userSearch: DouyinUserConfig;
  keywordSearch: DouyinKeywordSearchConfig;
}

export const douyinUserHeaders = (cookie: string, userId: string): object => ({
  authority: 'www.douyin.com',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  cookie,
  referer: `https://www.douyin.com/user/${userId}`,
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
});

export const douyinKeywordSearchHeaders = (cookie: string, keyword: string) => ({
  authority: 'www.douyin.com',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  cookie,
  referer: `https://www.douyin.com/search/${encodeURI(
    keyword,
  )}?publish_time=0&sort_type=2&source=tab_search&type=video`,
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
});

export const requestHeaders = (
  data: DouyinSearch,
  userData: DouyinUserConfig,
  searchData: DouyinKeywordSearchConfig,
): object => (data.type === 'user'
  ? douyinUserHeaders(userData.cookie, data.input)
  : douyinKeywordSearchHeaders(searchData.cookie, data.input));

export const buildUrl = (
  data: DouyinSearch,
  userData: DouyinUserConfig,
  searchData: DouyinKeywordSearchConfig,
): string => (data.type === 'user'
  ? userData.url
    .replace('<USER_ID>', data.input)
    .replace('<MAX_CURSOR>', userData.maxCursor)
    .replace('<POST_COUNT>', userData.postCount)
    .replace('<MS_TOKEN>', userData.msToken)
  : searchData.url
    .replace('<START_TIME>', searchData.startTime.toString())
    .replace('<SEARCH_KEY>', encodeURI(data.input))
    .replace('<OFFSET>', searchData.offset)
    .replace('<POST_COUNT>', searchData.postCount)
    .replace('<MS_TOKEN>', searchData.msToken));

export interface DouyinAuthor {
  sec_uid: string;
  nickname: string;
}

export interface DouyinKeywordSearchClipDetails {
  aweme_id: string;
  create_time: number;
  desc: string;
  author: DouyinAuthor;
}

export interface DouyinUserClipDetails {
  aweme_id: string;
  desc: string;
  create_time: number;
  author: DouyinAuthor;
}

export interface DouyinKeywordSearchResponse {
  aweme_info: DouyinKeywordSearchClipDetails;
}

export interface DouyinResponse {
  data: DouyinKeywordSearchResponse[];
  aweme_list: DouyinUserClipDetails[];
}

export function getDouyinContent(response: Response): DouyinResponse | null {
  const { body } = response;
  const { headers } = response;
  if (response.statusCode !== 200 || headers === undefined || body === undefined) return null;

  try {
    return JSON.parse(body);
  } catch (err) {
    Logger.info(`Failed to parse response body: ${err}`);
    return null;
  }
}
