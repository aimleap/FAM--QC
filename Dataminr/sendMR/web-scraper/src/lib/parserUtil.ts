import { promisify } from 'util';
import cheerio from 'cheerio';
import moment from 'moment';
import iconv from 'iconv-lite';
import lodash from 'lodash';
import { Response } from 'request';
import { delay, getResponse, random } from './crawler';
import Post from '../schema/post';
import Logger from './logger';
import { taskQueue } from './queue';
import Thread from './logging/thread';
import { redisClient } from './redis';
import { publishMessage } from '../spiders/parsers/Parser';
import { toSha1 } from './hashUtil';
import { URL_PLACE_HOLDER } from '../constants/url';
import { getContext } from './logging/context';

export function ConvertCase(string: string) {
  return string.split(' ').map(lodash.capitalize).join(' ');
}

export interface GenericSourceConfig {
  session: object; // place to store session information
  authentication: object; // place to store domain specific auth credentials
  configurations: object; // place to store domain specific configurations eg: searches..
}

// eslint-disable-next-line no-shadow
export enum SourceTypeEnum {
  FORUM = 'FORUM',
  MARKET_PLACE = 'MARKET_PLACE',
}

// Reference https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md
export interface RepeatOptions {
  cron?: string;
  delay?: number;
  every?: number;
}

// @ts-ignore
export interface SourceType {
  description: string;
  isCloudFlare?: boolean;
  name: string;
  randomDelay?: [number, number];
  requestOption?: object;
  repeatOptions?: RepeatOptions;
  type: SourceTypeEnum;
  url: string;
  entryUrl?: string;
  expireIn?: number; // Skip last visit url in seconds
  injectHeaders?: boolean;
}

export interface LinkType {
  text: string;
  link: string;
}

export interface ThreadRequestOption {
  method?: string;
  headers?: any;
  body?: any;
  proxy?: string;
}

export interface ThreadType {
  title: string;
  link: string;
  timestamp: number;
  parserName?: string;
  /*
   * Ref: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueadd
   * JobOpts.delay in ms
   * */
  delay?: number;
  priority?: number;
  requestOption?: ThreadRequestOption;
}

export interface CommentObject {
  text: string;
  timestamp: string;
  userName: string;
  userUrl: string;
  isComment: string;
  postID?: string;
}

export type transformerFunc = (
  $: CheerioSelector,
  forumPaths: string[],
  post: CheerioElement,
  url: string,
) => Post;

export type parserFunc = (
  $: CheerioSelector,
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
) => boolean;

export type timestampParserFunc = ($: CheerioSelector, element: CheerioElement) => number;

export interface Parser {
  name: string;
  publish: boolean;
  selectors: string[];
  transformerFunc: transformerFunc | null;
  parserFunc: parserFunc | null;
}

export interface Pagination {
  page: number;
  link: string;
}

// TODO redundant code
export const getHtmlSelector = async (
  source: SourceType,
  url: string,
  options: object = {},
  ignoreFailResponse: boolean = false,
): Promise<CheerioSelector> => {
  const { isCloudFlare = false, randomDelay }: SourceType = source;

  if (Array.isArray(randomDelay) && randomDelay.length === 2) {
    await delay(random(randomDelay[0], randomDelay[1]));
  }

  let body = '';
  let headers = {};

  try {
    const response = await getResponse(
      { url, method: 'GET', ...options },
      isCloudFlare,
      source.name,
    );
    body = response.body;
    headers = response.headers;
  } catch (err: any) {
    body = err.response.body;
    headers = err.response.headers;

    if (!ignoreFailResponse) {
      throw new Error('bad response');
    }
  }

  let charset = [];

  // @ts-ignore
  if (headers && headers['content-type']) {
    // @ts-ignore
    charset = headers['content-type'].match(/charset=([\w\d-]+)/);
  }

  if (
    // @ts-ignore
    options.encoding === 'binary'
    && Array.isArray(charset)
    && charset.length === 2
  ) {
    // @ts-ignore
    return cheerio.load(iconv.decode(body, charset[1]));
  }

  return cheerio.load(body);
};

export const getAnchorLinks = ($: CheerioSelector, selector: string): LinkType[] => $(selector)
  .map((i, el) => {
    const $el = $(el);
    return {
      text: $el.text(),
      link: $el.attr('href'),
    };
  })
  .get() || [];

export const getHtmlText = ($: CheerioSelector, selector: string): string[] => $(selector)
  .map((i, el) => $(el).html())
  .get() || [];

export const appendDomain = (domain: string, link: string): string => {
  if (link.search(/^http:\/\/|^https:\/\//) === 0 || domain === URL_PLACE_HOLDER) return link;
  return `${domain.replace(/\/+$/, '')}/${link.replace(/^\/+/, '')}`;
};

export const appendLink = (source: SourceType, link: string): string => appendDomain(source.url, link);

export const getHtmlTextBySelectors = (
  $: CheerioSelector,
  selectors: string[],
): CheerioElement[] => {
  for (const selector of selectors) {
    const elements: CheerioElement[] = $(selector).get();
    if (elements.length > 0) return elements;
  }

  return [];
};

export const sortPagination = (pagination: Pagination[], asc: boolean): Pagination[] => pagination.sort((a, b) => (asc ? a.page - b.page : b.page - a.page));

export function getThreadType(
  element: CheerioElement,
  $: CheerioSelector,
  titleSelector: string,
  linkSelector: string,
  timestampParseFunc: timestampParserFunc,
): ThreadType | null {
  const $el = $(element);
  const title = $el.find(titleSelector).text();
  const link = $el.find(linkSelector).attr('href');
  const timestamp = timestampParseFunc($, element);

  // eslint-disable-next-line no-restricted-globals
  if (title !== undefined && link !== undefined && !isNaN(timestamp)) {
    return {
      link,
      timestamp,
      title,
    };
  }

  return null;
}

export function getPaginationThreadArray(
  $: CheerioSelector,
  elements: CheerioElement[],
  titleSelector: string,
  linkSelectors: string[],
  timestampParseFunc: timestampParserFunc,
  asc: boolean = false,
): ThreadType[] {
  // @ts-ignore
  return elements
    .map((element) => {
      const $el = $(element);
      const thread = getThreadType(element, $, titleSelector, linkSelectors[0], timestampParseFunc);

      if (linkSelectors.length === 2 && thread !== null) {
        const navigation = $el.find(linkSelectors[1]).get();
        let pages: Pagination[] = navigation
          .map((p) => ({
            page: parseInt($el.find(p).text(), 10),
            link: p.attribs.href,
          }))
          // eslint-disable-next-line no-restricted-globals
          .filter((pagination) => !isNaN(pagination.page));

        pages = sortPagination(pages, asc);
        thread.link = pages.length >= 1 ? pages[0].link : thread.link;
      }

      return thread;
    })
    .filter((t) => t !== null);
}

export function getThreadArray(
  $: CheerioSelector,
  elements: CheerioElement[],
  titleSelector: string,
  linkSelector: string,
  timestampParseFunc: timestampParserFunc,
): ThreadType[] {
  // @ts-ignore
  return elements
    .map((element) => getThreadType(element, $, titleSelector, linkSelector, timestampParseFunc))
    .filter((t) => t !== null);
}

export function getThreadSet(
  $: CheerioSelector,
  elements: CheerioElement[],
  titleSelector: string,
  linkSelector: string,
  timestampParseFunc: timestampParserFunc,
): Set<ThreadType> {
  return new Set(getThreadArray($, elements, titleSelector, linkSelector, timestampParseFunc));
}

export const discoverThread = (
  forumPaths: string[],
  backFilledTimestamp: number,
  thread: ThreadType,
  source: SourceType,
): boolean => {
  if (thread.timestamp < backFilledTimestamp) return false;

  const path = [...forumPaths, thread.title];
  const url = appendLink(source, thread.link);
  taskQueue.add(source.name, {
    path,
    url,
  });
  Logger.info('discover a thread', new Thread({ path, url, timestamp: thread.timestamp }));
  return true;
};

export const getVisitedKey = (url: string, source: SourceType): string => `${source.name}_${toSha1(url)}`;
export const getJobKey = (url: string): string => `JOB_${toSha1(url)}`;
export const getMaxJobKey = (name: string): string => `MAX_JOB_${name}`;

export const getMaxJobsCount = async (name: string): Promise<number> => {
  const result = await promisify(redisClient.get).call(redisClient, getMaxJobKey(name));
  if (typeof result !== 'string') return 0;
  return parseInt(result, 10);
};

export const increaseJobCount = async (name: string, count: number) => {
  const currentCount = await getMaxJobsCount(name);
  const jobKey = getMaxJobKey(name);
  return Promise.all([
    redisClient.set(jobKey, currentCount + count),
    redisClient.expire(jobKey, 600),
  ]);
};

export const isVisited = async (key: string): Promise<boolean> => {
  const result = await promisify(redisClient.get).call(redisClient, key);
  return result === 'true';
};

export const visit = async (key: string, expiration: number = 600) => Promise.all([
  // @ts-ignore
  promisify(redisClient.set).call(redisClient, key, true),
  promisify(redisClient.expire).call(redisClient, key, expiration),
]);

export const parse = async (
  $: CheerioSelector,
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  parsers: Parser[],
  source: SourceType,
): Promise<void> => {
  const crawledAt = moment().unix();

  for (const parser of parsers) {
    const {
      /* eslint-disable no-shadow */
      parserFunc,
      publish: isPublished,
      selectors,
      transformerFunc,
    }: Parser = parser;

    const isPost = isPublished && typeof transformerFunc === 'function';

    if (isPost) {
      const messages = getHtmlTextBySelectors($, selectors);
      // eslint-disable-next-line no-continue
      if (messages.length === 0) continue;

      const tasks: Promise<void>[] = [];

      messages.forEach((message: CheerioElement) => {
        try {
          // @ts-ignore
          const post: Post = transformerFunc($, forumPaths, message, url);
          const postedAt = parseInt(post.posted_at.toString(), 10);

          if (
            // eslint-disable-next-line no-restricted-globals
            isNaN(postedAt)
            || postedAt === 0
            || post.text.trim().length === 0
            || post.posted_at < backFilledTimestamp
          ) return;

          const t = publishMessage(post, crawledAt, source, url);

          if (t !== null) tasks.push(t);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      });

      // eslint-disable-next-line no-await-in-loop
      await Promise.all(tasks);
    }

    const found = typeof parserFunc === 'function' && parserFunc($, forumPaths, backFilledTimestamp, url);

    if (found || isPost) return;

    /* eslint-enable no-shadow */
  }
};

export const getAuthKey = (source: SourceType) => `${source.name}_auth_key_`;

const ONE_DAY = 60 * 60 * 24;

export const getAuthData = async (key: string): Promise<any> => {
  const data = await promisify(redisClient.get).call(redisClient, key);

  if (data == null) return {};

  await promisify(redisClient.expire).call(redisClient, key, ONE_DAY);

  // @ts-ignore
  return JSON.parse(data);
};

// @ts-ignore
export const setAuthData = async (key: string, data: object) => {
  await promisify(redisClient.set).call(redisClient, key, JSON.stringify(data));
  await promisify(redisClient.expire).call(redisClient, key, ONE_DAY);
};

export function cleanString(text: string): string {
  if (text.includes('<br') || text.includes('<a') || text.includes('href')) {
    return text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .split('href')[0]
      .trim();
  }
  return text.trim();
}

export function getForumComments(
  $: CheerioSelector,
  el: Cheerio,
  entrySelector: string,
  commentTextSelector: string,
  commentTimeSelector: string,
  commentTimeAttribute: string,
  userSelector: string,
  userUrlSelector: string,
  postIdSelector?: string,
): CommentObject[] {
  const result: CommentObject[] = [];

  const comments = el.find(entrySelector).get();
  comments.forEach((e) => {
    const commentText = $(e).find(commentTextSelector).text();
    const commentTime = $(e).find(commentTimeSelector).attr(commentTimeAttribute)
      || $(e).find(commentTimeSelector).text();
    const username = $(e).find(userSelector).text();
    const userUrl = $(e).find(userUrlSelector).attr('href');
    const postID = postIdSelector !== undefined ? $(e).find(postIdSelector).text() : 'N/A';

    result.push({
      text: commentText,
      timestamp: commentTime,
      userName: username,
      userUrl,
      isComment: '1',
      postID,
    });
  });

  return result;
}

export function parseAPIResponse(response: Response): any {
  const { body } = response;
  const { headers } = response;
  if (response.statusCode !== 200 || headers === undefined || body === undefined) return null;
  try {
    return JSON.parse(body);
  } catch (err) {
    Logger.warn(
      `Failed to parse response body: ${err} for ${response.url}`,
      getContext(0, response.url || ''),
    );
    return null;
  }
}

export function pageGenerator(start: number, stop: number, step: number): number[] {
  return Array.from({ length: Math.ceil((stop + 1 - start) / step) }, (_, i) => start + i * step);
}
