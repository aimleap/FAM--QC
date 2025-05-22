import { Response } from 'request';
import _ from 'lodash';
import bigInt from 'big-integer';
import dayjs from 'dayjs';
import { getResponse } from './crawler';
import { redisClient } from './redis';
import { insert } from './influxDB';
import {
  APIRequestCredsGuest,
  APIRequestCredsUser,
  GraphqlMedia,
  GraphqlUserMention,
  TwitterCustomIngestMedia,
  TwitterCustomIngestUserMention,
  TwitterSearchConfig,
} from './twitterInterfaces';
import { Metrics } from '../constants/metrics';
import Logger from './logger';

const GUEST_TOKEN_URL = 'https://api.twitter.com/1.1/guest/activate.json';
const GRAPHQL_URL_HANDLE = 'https://twitter.com/i/api/graphql/25oeBocoJ0NLTbSBegxleg/UserTweets';
const GRAPHQL_URL_LISTS = 'https://twitter.com/i/api/graphql/hpd0JOlf0m0oiqvSmGkq1w/ListLatestTweetsTimeline';
const TWITTER_START_EPOCH = 1288834974657;
// redis key for guest bearer token
export const GUEST_STATIC_TOKEN_KEY = 'GUEST_STATIC_TOKEN';

export interface GuestBearerToken {
  token: string;
}

export interface TwitterGuestToken {
  guest_token: string;
}

interface UserLegacyDetails {
  name: string;
  screen_name: string;
  location: string;
  description: string;
  translator_type: string;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  utc_offset: string | null;
  time_zone: string | null;
  geo_enabled: boolean;
  lang: string | null;
  contributors_enabled: boolean;
  is_translator: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url: string;
  default_profile: boolean;
  default_profile_image: boolean;
  following: boolean | null;
  follow_request_sent: boolean | null;
  notifications: boolean | null;
  witheld_in_countries: string[];
}

export interface UserResultDetails {
  __typename: string;
  rest_id: string;
  is_blue_verified: boolean;
  legacy: UserLegacyDetails;
}

interface UserResult {
  result: UserResultDetails;
}

interface CoreResult {
  user_results: UserResult;
}

interface LegacyEntities {
  media: any[];
  user_mentions: any[];
  urls: any[];
  symbols: any[];
  hashtags: any[];
}

interface ExtendedLegacyEntities {
  media: any[];
}

interface RetweetLegacyData {
  created_at: string;
  full_text: string;
  source: string;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id_str: string;
  in_reply_to_screen_name: string;
  is_quote_status: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  favorited: boolean;
  possibly_sensitive: boolean;
  lang: string;
  entities: LegacyEntities;
}

interface RetweetUserLegacy {
  name: string;
  screen_name: string;
  location: string;
  url: string | null;
  description: string;
  translator_type: string;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  utc_offset: string | null;
  timezone: string | null;
  geo_enabled: boolean | null;
  lang: string | null;
  contributors_enabled: boolean;
  is_translator: boolean;
  profile_image_url_https: string;
  default_profile: boolean;
  default_profile_image: boolean;
  following: boolean | null;
  follow_request_sent: boolean | null;
  notifications: boolean | null;
  witheld_in_countries: string[];
}

interface RetweetUserData {
  rest_id: string; // retweet user id
  is_blue_verified: boolean;
  legacy: RetweetUserLegacy;
}

interface RetweetResult {
  result: RetweetUserData;
}

interface RetweetResultDetails {
  user_results: RetweetResult;
}

interface RetweetSatusResult {
  __typename: string;
  rest_id: string; // retweet message id
  core: RetweetResultDetails;
  legacy: RetweetLegacyData;
}

interface RetweetStatus {
  result: RetweetSatusResult;
}

export interface LegacyResult {
  created_at: string;
  full_text: string;
  id_str: string;
  source: string;
  in_reply_to_screen_name: string;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id_str: string;
  is_quote_status: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
  entities: LegacyEntities;
  extended_entities: ExtendedLegacyEntities;
  favorited: boolean;
  retweeted: boolean;
  retweeted_status_result: RetweetStatus;
  possibly_sensitive: boolean;
  edit_history: object;
  edit_control: object;
  lang: string;
}

// seems lke some messages have different structure than others
interface TweetObjectV2Result {
  legacy: LegacyResult;
  core: CoreResult;
}

interface Result {
  __typename: string;
  rest_id: string;
  core: CoreResult;
  legacy: LegacyResult;
  tweet: TweetObjectV2Result;
}

interface TweetResult {
  result: Result;
}

interface TwitterItemContent {
  itemType: string;
  __typename: string;
  tweet_results: TweetResult;
  tweetDisplayType: string;
}

interface TwitterDataEntryContent {
  entryType: string;
  __typename: string;
  value: string;
  itemContent: TwitterItemContent;
}

export interface TwitterDataEntries {
  entryId: string;
  sortIndex: string;
  content: TwitterDataEntryContent;
}

export interface TwitterInstructions {
  type: string;
  entries: TwitterDataEntries[];
}

interface TwitterTimelineObject {
  instructions: TwitterInstructions[];
  responseObjects: object;
}

interface TwitterTimelineV2 {
  timeline: TwitterTimelineObject;
}

interface TwitterResult {
  timeline_v2: TwitterTimelineV2;
}

interface TwitterUserData {
  result: TwitterResult;
}

interface ListTimeline {
  tweets_timeline: TwitterTimelineV2;
}

interface TwitterData {
  user: TwitterUserData;
  list: ListTimeline;
}

/**
 * Entry response from graph ql API
 */
export interface TwitterResponse {
  data: TwitterData;
}

interface ListRequestVariables {
  listId: string;
  count: number;
  cursor: string;
  withSuperFollowsUserFields: boolean;
  withDownvotePerspective: boolean;
  withReactionsMetadata: boolean;
  withReactionsPerspective: boolean;
  withSuperFollowsTweetFields: boolean;
}

interface ListRequestFeatures {
  responsive_web_twitter_blue_verified_badge_is_enabled: boolean;
  verified_phone_label_enabled: boolean;
  responsive_web_graphql_timeline_navigation_enabled: boolean;
  unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: boolean;
  tweetypie_unmention_optimization_enabled: boolean;
  responsive_web_uc_gql_enabled: boolean;
  vibe_api_enabled: boolean;
  responsive_web_edit_tweet_api_enabled: boolean;
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: boolean;
  standardized_nudges_misinfo: boolean;
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: boolean;
  interactive_text_enabled: boolean;
  responsive_web_text_conversations_enabled: boolean;
  responsive_web_enhance_cards_enabled: boolean;
}

interface HandleRequestVariables {
  userId: string;
  count: number;
  cursor: string;
  includePromotedContent: boolean;
  withQuickPromoteEligibilityTweetFields: boolean;
  withSuperFollowsUserFields: boolean;
  withDownvotePerspective: boolean;
  withReactionsMetadata: boolean;
  withReactionsPerspective: boolean;
  withSuperFollowsTweetFields: boolean;
  withVoice: boolean;
  withV2Timeline: boolean;
}

interface HandleRequestFeatures {
  responsive_web_twitter_blue_verified_badge_is_enabled: boolean;
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: boolean;
  responsive_web_graphql_timeline_navigation_enabled: boolean;
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: boolean;
  unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: boolean;
  responsive_web_enhance_cards_enabled: boolean;
  responsive_web_edit_tweet_api_enabled: boolean;
  interactive_text_enabled: boolean;
  responsive_web_text_conversations_enabled: boolean;
  verified_phone_label_enabled: boolean;
  tweetypie_unmention_optimization_enabled: boolean;
  responsive_web_uc_gql_enabled: boolean;
  standardized_nudges_misinfo: boolean;
  vibe_api_enabled: boolean;
}

export const listRequestVariables = (
  id: string,
  tweetCount: number,
  paginationId: string,
): ListRequestVariables => ({
  listId: id,
  count: tweetCount,
  cursor: paginationId,
  withSuperFollowsUserFields: true,
  withDownvotePerspective: false,
  withReactionsMetadata: false,
  withReactionsPerspective: false,
  withSuperFollowsTweetFields: true,
});

export const listRequestFeatures = (): ListRequestFeatures => ({
  responsive_web_twitter_blue_verified_badge_is_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_uc_gql_enabled: true,
  vibe_api_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
  interactive_text_enabled: true,
  responsive_web_text_conversations_enabled: false,
  responsive_web_enhance_cards_enabled: true,
});

export const handleRequestVariables = (
  id: string,
  tweetCount: number,
  paginationId: string,
): HandleRequestVariables => ({
  userId: id,
  count: tweetCount,
  cursor: paginationId,
  includePromotedContent: false,
  withQuickPromoteEligibilityTweetFields: true,
  withSuperFollowsUserFields: true,
  withDownvotePerspective: false,
  withReactionsMetadata: false,
  withReactionsPerspective: false,
  withSuperFollowsTweetFields: true,
  withVoice: true,
  withV2Timeline: true,
});

export const handleRequestFeatures = (): HandleRequestFeatures => ({
  responsive_web_twitter_blue_verified_badge_is_enabled: true,
  verified_phone_label_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_uc_gql_enabled: true,
  vibe_api_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
  interactive_text_enabled: true,
  responsive_web_text_conversations_enabled: true,
  responsive_web_enhance_cards_enabled: true,
});

function delayRequest(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const requestGuestToken = async (
  guestToken: GuestBearerToken,
): Promise<TwitterGuestToken | null> => {
  Logger.info('Generating guest static token');
  const response = await getResponse(
    {
      url: GUEST_TOKEN_URL,
      method: 'POST',
      // @ts-ignore
      headers: {
        Authorization: `Bearer ${guestToken.token}`,
      },
    },
    false,
    'Twitter',
  );
  if (response.statusCode !== 200) return null;
  return JSON.parse(response.body);
};

export const getGuestStaticToken = async (): Promise<GuestBearerToken | null> => {
  const token = await redisClient.get(GUEST_STATIC_TOKEN_KEY);
  if (token === null) return null;
  return JSON.parse(token);
};

export const postResponseMetrics = async (url: string, response: Response, metricName: string) => {
  await insert(
    metricName,
    { value: 1 },
    {
      url,
      code: response.statusCode,
    },
  );
};

export const convertUserEntity = (graphqlMedia: any[]): TwitterCustomIngestUserMention[] | [] => {
  /**
   * Ensure user mention format is aligned with the requirements of the custom ingest
   */
  if (graphqlMedia === undefined || graphqlMedia.length === 0) return [];
  const customIngestUserMention: TwitterCustomIngestUserMention[] = [];
  graphqlMedia.map((el: GraphqlUserMention) => {
    const id = Number(el.id_str);
    return customIngestUserMention.push({
      id,
      id_str: el.id_str,
      name: el.name,
      screen_name: el.screen_name,
      indices: el.indices,
    });
  });
  return customIngestUserMention;
};

export const convertMediaEntity = (
  graphqlMedia: any[],
  sourceStatusId: string,
  sourceUserId: string,
): TwitterCustomIngestMedia[] | [] => {
  /**
   * Ensure media entity is aligned with the requirements of the custom ingest
   */
  if (graphqlMedia === undefined || graphqlMedia.length === 0) return [];
  const customIngestMedia: TwitterCustomIngestMedia[] = [];
  graphqlMedia.map((el: GraphqlMedia) => {
    const mediaUrl = el.media_url_https.replace('https:', 'http:');
    const id = Number(el.id_str);
    return customIngestMedia.push({
      id,
      id_str: el.id_str,
      indices: el.indices,
      media_url: mediaUrl,
      media_url_https: el.media_url_https,
      url: el.url,
      display_url: el.display_url,
      expanded_url: el.expanded_url,
      type: el.type,
      sizes: el.sizes,
      source_status_id: Number(sourceStatusId),
      source_status_id_str: sourceStatusId,
      source_user_id: Number(sourceUserId),
      source_user_id_str: sourceUserId,
    });
  });
  return customIngestMedia;
};

export const isRetweet = (retweetObject: RetweetStatus): boolean => retweetObject !== undefined;

export const parseThreadHandlerSearchConfig = (forumPaths: string[]): TwitterSearchConfig => {
  /**
   * Parse search config passed via forumPaths in threadHandler
   */
  const configData = forumPaths[0].split('__');
  const pagesExtract = configData[2].split('__useLoginTokens=')[0].match(/(?<=pages=).*$/);
  const pages: number = pagesExtract !== null ? parseInt(pagesExtract[0], 10) : 1; // how many pages to extract tweets from
  const useLoginTokenExtract = configData[3].split('__type=')[0].match(/(?<=useLoginTokens=).*$/);
  const useLoginToken: string = useLoginTokenExtract !== null ? useLoginTokenExtract[0].trim() : 'false'; // decide whether we want to use login credentials or guest credentials
  const searchTypeExtract = configData[4].match(/(?<=type=).*$/); // get search type (either list or handle)
  const searchType = searchTypeExtract !== null ? searchTypeExtract[0] : '';
  const id = configData[0].trim(); // Twitter user or list id
  const tweetCount = parseInt(configData[1].trim(), 10); // number of tweets to return for a search
  return {
    pages,
    useLoginToken,
    searchType,
    id,
    tweetCount,
  };
};

const twitterGraphqlRequest = async (
  url: string,
  headers: APIRequestCredsGuest | APIRequestCredsUser,
): Promise<TwitterResponse | null> => {
  await delayRequest(_.random(5, 15) * 1000); // randomly delay request to graphql api
  const response = await getResponse(
    {
      url,
      method: 'GET',
      // @ts-ignore
      headers,
    },
    false,
    'Twitter',
  );
  await postResponseMetrics(url, response, Metrics.TWITTER_REQUEST);
  if (response.statusCode !== 200) {
    Logger.info('Graphql request was not successful', response.body);
    return null;
  }
  return JSON.parse(response.body);
};

const constructGraphqlSearchUrl = (
  searchConfig: TwitterSearchConfig,
  type: string,
  paginationId: string,
): string => {
  /**
   * Build search url based on search type. Currently supported is handle
   * based search which retrieves tweets for specific handles and
   * list based search which returns tweets for a specific list
   * @param searchConfig: search configuration passed via threadHandler
   * @param type: search type. Can be either handle or list
   * @param paginationId: specific page id
   */
  if (type === 'handle') {
    Logger.info('Building URL for twitter handle search');
    return encodeURI(
      `${GRAPHQL_URL_HANDLE}?variables=${JSON.stringify(
        handleRequestVariables(searchConfig.id, searchConfig.tweetCount, paginationId),
      )}&features=${JSON.stringify(handleRequestFeatures())}`,
    );
  }
  Logger.info('Building URL for twitter list search');
  return encodeURI(
    `${GRAPHQL_URL_LISTS}?variables=${JSON.stringify(
      listRequestVariables(searchConfig.id, searchConfig.tweetCount, paginationId),
    )}&features=${JSON.stringify(listRequestFeatures())}`,
  );
};

export const twitterSearch = async (
  searchConfig: TwitterSearchConfig,
  pages: number,
  headers: APIRequestCredsUser | APIRequestCredsGuest,
  searchType: string,
): Promise<TwitterDataEntries[]> => {
  /**
   * Method for paginating Twitter search utilising cursorId. cursorId
   * for intiial request is set to -1. Subsequent requests provide cursorIds
   * for next pages
   * @param searchConfig: search configuration passed via threadHandler
   * @param pages: number pages to search through
   * @param headers: authorization headers
   * @param searchType: search type. Can be either handle or list
   */
  let requestCount = 0;
  let cursorId = '-1'; // initial cursor value
  const tweets: TwitterDataEntries[] = [];

  while (requestCount <= pages) {
    if (cursorId === '0') return [];
    const url = constructGraphqlSearchUrl(searchConfig, searchType, cursorId);
    Logger.info(
      `Requesting twitter graphql data with cursor: ${cursorId}. Current request count: ${requestCount}`,
    );
    // eslint-disable-next-line no-await-in-loop
    const response = await twitterGraphqlRequest(url, headers);
    if (response === null) return [];
    let entryContent: TwitterInstructions[] = [];
    try {
      entryContent = searchType === 'handle'
        ? response.data.user.result.timeline_v2.timeline.instructions // response object for handle search
        : response.data.list.tweets_timeline.timeline.instructions; // response object for list search
    } catch (e) {
      Logger.info('Failed to get content from graphql api call');
    }
    if (entryContent.length === 0) return [];
    const { entries } = entryContent.filter((f) => f.type === 'TimelineAddEntries')[0];
    if (entries.length === 0) return [];
    // eslint-disable-next-line no-loop-func
    entries.forEach((entry: TwitterDataEntries) => {
      cursorId = entry.entryId.startsWith('cursor-bottom') ? entry.content.value : '0';
      tweets.push(entry);
    });
    requestCount += 1;
  }
  return tweets;
};

export const parseTwitterTimestamp = (
  statusID: string,
  fallbackTimestamp: string,
  getMillis: boolean = true,
): string => {
  /**
   * use fallback timestamp without millisecond
   * reference: https://github.com/alkihis/twitter-snowflake-to-date/blob/master/src/index.ts
   */
  if (statusID.length <= 13) {
    return fallbackTimestamp;
  }
  if (getMillis) return `${new Date(+bigInt(statusID).shiftRight(22) + TWITTER_START_EPOCH).getTime()}`;
  const isoStringTs = new Date(
    +bigInt(statusID).shiftRight(22) + TWITTER_START_EPOCH,
  ).toISOString();
  return dayjs.utc(isoStringTs).format('ddd MMM DD HH:mm:ss:SSS ZZ YYYY');
};

export const bigNumberConverter = (id: string): number => +bigInt(id);
