import { parseTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import Url from 'url';
import { Response } from 'request';
import Logger from './logger';
import Post from '../schema/post';
import { METADATA } from '../constants/metadata';
import { extraDataMap, REDDIT_BASE_URL, RedditChildrenData } from './reddit/redditUtil';
import { SOURCE_TYPE } from '../constants/sourceType';

export interface AimLeapRedditConfig {
  maxPages: number;
  maxItemsPerPage: number;
}

export interface AimLeapSourceConfig {
  sources: object;
  password: string;
}

export interface AimLeapResponse {
  content: string;
  url: string;
  website_name: string;
  timestamp: any;
  date_of_scrap: string;
  text: string;
  extradata: any;
  data?: any;
}

/**
 * if true, sets source name on
 * the message to
 * entity field specified
 * in the source schema
 */
export interface AimLeapSourceOptions {
  set_source_name: boolean;
}

export function getAPIContent(response: Response): AimLeapResponse[] | null {
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

export function parseConfig(extraData: any, rawMap: any, sourceName: string): Map<any, any> | null {
  const outputMap = new Map();
  try {
    if (rawMap === null || Object.keys(rawMap).length === 0) return new Map();
    const sourceOptions: AimLeapSourceOptions | undefined = rawMap[`${sourceName}`].options;
    const schemaConfig = rawMap[`${sourceName}`].schema;
    if (schemaConfig === null || schemaConfig === 'None') return new Map();
    Object.keys(schemaConfig).forEach((objKey) => {
      outputMap.set(schemaConfig[objKey], extraData[objKey]);
    });
    if (sourceOptions !== undefined && sourceOptions.set_source_name) {
      const entityField = outputMap.get('entity') !== undefined ? outputMap.get('entity') : sourceName;
      outputMap.set('message_source_name', entityField);
    }
  } catch (e) {
    Logger.info(`Could not process AimLeapConfig for ${sourceName}`, e);
    return null;
  }
  return outputMap;
}

export function parseExtraData(data: any): any {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

/**
 * Function ensuring that the user id for incoming Weibo message is not included
 * in the list of userIds defined for internal Weibo parsing
 * @param userId incoming message userId
 * @param weiboPageIds existing weibo page ids
 */
export function excludeUser(userId: string, weiboPageIds: string[]): boolean {
  if (weiboPageIds.includes(userId)) {
    Logger.info(`Excluding weibo user id: ${userId}`);
    return true;
  }
  return false;
}

export function extractUserName(extraData: Map<any, any>, forumPaths: string[]): string {
  return extraData.get('message_source_name') !== undefined
    ? extraData.get('message_source_name')
    : forumPaths[0];
}

export function generatePost(
  data: AimLeapResponse,
  forumPaths: string[],
  extraData: Map<any, any>,
): Post {
  const sourceUrl = Url.parse(data.url);
  const userName = extractUserName(extraData, forumPaths);
  return new Post(
    data.text,
    {
      current_url: data.url.includes('/power-cut/')
        ? `https://www.ukpowernetworks.co.uk${data.url}`
        : data.url,
      author_name: userName,
      author_url: data.url,
      [METADATA.SOURCE_NAME]: forumPaths[0],
      [METADATA.SOURCE_URL]: `${sourceUrl.protocol}//${sourceUrl.host}`,
    },
    parseTimestamp(data.date_of_scrap),
    [],
    [],
    extraData,
  );
}

export function generateAimLeapRedditPost(redditPost: RedditChildrenData): Post {
  const postText = `${redditPost.title}. ${redditPost.selftext}`;
  // kind.t1 is a post and kind.t3 is a comment
  const text = redditPost.kind !== undefined && redditPost.kind === 't1' ? redditPost.body : postText;
  const url = redditPost.kind !== undefined && redditPost.kind === 't1'
    ? `${REDDIT_BASE_URL}${redditPost.permalink}`
    : redditPost.url;
  return new Post(
    text,
    {
      current_url: url,
      author_name: redditPost.author,
      author_url: `${REDDIT_BASE_URL}/user/${redditPost.author}/`,
    },
    redditPost.created_utc,
    [],
    [],
    extraDataMap(redditPost),
    new Map(),
    [],
    SOURCE_TYPE.REDDIT,
  );
}

export function generateAimLeapCitizenPost(post: AimLeapResponse): Post {
  return new Post(
    post.text,
    {
      current_url: post.url,
    },
    post.timestamp,
    [],
    [],
    new Map(
      Object.entries({
        rawText: post.extradata.rawText,
        transcription: post.extradata.transcription,
        update: post.extradata.update,
        rawlocation: post.extradata.rawlocation,
        hasVod: post.extradata.hasVod,
        neighborhood: post.extradata.neighborhood,
        latitude: post.extradata.latitude,
        longitude: post.extradata.longitude,
      }),
    ),
  );
}

export function generateAimLeapCitizenLatestPost(post: AimLeapResponse): Post {
  return new Post(
    `ctzn_v2 ${post.text}`,
    {
      current_url: post.url,
    },
    post.timestamp,
    [],
    [],
    new Map(
      Object.entries({
        rawText: post.extradata.title,
        update: post.extradata.update,
        rawlocation: post.extradata.location,
        hasVod: post.extradata['ranking.has_video'],
        neighborhood: post.extradata.neighborhood,
        latitude: post.extradata.latitude,
        longitude: post.extradata.longitude,
      }),
    ),
  );
}
