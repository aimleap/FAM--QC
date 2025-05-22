import { Response } from 'request';
import _ from 'lodash';
import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink, SourceType, SourceTypeEnum, ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

import { getResponse } from '../../../../lib/crawler';
import { lastSeenToUnixTimestamp } from '../../../../lib/timestampUtil';
import { METADATA } from '../../../../constants/metadata';
import Logger from '../../../../lib/logger';
import { ErrorMessage } from '../../../../constants/errorMessage';
import { redisClient } from '../../../../lib/redis';
import { getCredentialsByDomain } from '../../../../lib/keeper';

const BACKFILLED_MINUTE = 7;

export const source: SourceType = {
  description: 'Radio calls ingest platform',
  name: 'BroadcastifyCalls',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.broadcastify.com/',
  entryUrl: '/calls/status/',
};

export interface BCNode {
  'call-ttl': number;
  call_duration: number;
  call_freq: number;
  call_src: number;
  call_src_key: string;
  call_tg: number;
  call_timediff: number;
  call_type: number;
  descr: string;
  display: string;
  enc: string;
  filename: string;
  grouping: string;
  id: string;
  meta_starttime: number;
  meta_stoptime: number;
  sid: number;
  siteId: number;
  systemId: number;
  tag: number;
  tgCid: number;
  tgId: number;
  ts: number;
  hash: string;
}

export interface LiveCallResponse {
  calls: BCNode[];
  serverTime: number;
  lastPos: number;
}

const CALL_API = 'https://calls.broadcastify.com';
const LIVE_CALL_API = '/calls/apis/live-calls';
const BC_COOKIE_KEY = 'Broadcastify_Cookie';

/* eslint-disable */
function getSessionKey(): string {
  return 'xxxxxxxx-yyyy'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
/* eslint-enable */

async function authenticate(username: string, password: string): Promise<string> {
  Logger.info(`Attempt to login to ${source.name} with ${username}`);

  let response = null;

  try {
    response = await getResponse(
      {
        method: 'POST',
        url: 'https://www.broadcastify.com/login/',
        // @ts-ignore
        form: {
          username,
          password,
          action: 'auth',
          redirect: appendLink(source, '/account/'),
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      false,
      source.name,
    );
  } catch (e) {
    // @ts-ignore
    if (e.response && e.response.statusCode === 302) {
      // @ts-ignore
      response = e.response;
    }
  }

  if (response.body.search(/Invalid Login or Password/i) !== -1) {
    Logger.warn(`invalid credential username: ${username}`);
    throw new Error(ErrorMessage.INVALID_CREDENTIAL);
  }

  const cookieIndex = response.rawHeaders.indexOf('Set-Cookie');
  if (cookieIndex === -1 || cookieIndex >= response.rawHeaders.length) throw new Error("couldn't locate cookie in headers");

  return response.rawHeaders[cookieIndex + 1];
}

async function requestCookie(): Promise<string> {
  const credentials = await getCredentialsByDomain(source.url);
  if (credentials.length === 0) throw new Error('failed to get Broadcastify credentials');

  const { login: username, password } = credentials[_.random(0, credentials.length - 1)];
  return authenticate(username, password);
}

async function validateCookie(cookie: string): Promise<boolean> {
  const backfilledTimestamp = moment().subtract(BACKFILLED_MINUTE, 'minutes').unix();
  // hardcode group id
  const response = await getResponse(
    {
      url: appendLink(source, LIVE_CALL_API),
      body: `pos=${backfilledTimestamp}&doInit=1&systemId=1731&sid=0&sessionKey=${getSessionKey()}`,
      headers: {
        cookie,
      },
      method: 'post',
    },
    false,
    source.name,
  );

  return response.statusCode === 200 || response.statusCode === 302;
}

async function getCookie(): Promise<string> {
  let cookie = await redisClient.get(BC_COOKIE_KEY);

  // first time login
  if (cookie === null) {
    cookie = await requestCookie();
  }

  let isValidCookie = await validateCookie(cookie);

  if (!isValidCookie) {
    // try re-login one more time
    cookie = await requestCookie();
    isValidCookie = await validateCookie(cookie);
  }

  if (!isValidCookie) throw new Error('failed to obtain valid cookie');

  return cookie;
}

async function statusHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  if (elements.length === 0) return [];

  const cookie = await getCookie();

  // Saving cookie in cache
  Logger.info('caching BC call cookie in cache');

  await redisClient.pipeline().set(BC_COOKIE_KEY, cookie).expire(BC_COOKIE_KEY, 3600).exec();

  const backfilledTimestamp = moment().subtract(BACKFILLED_MINUTE, 'minutes').unix();
  const sessionKey = getSessionKey();

  const filterStart = +new Date();
  const elementsFiltered = elements.filter(
    (el) => lastSeenToUnixTimestamp($(el).find('td.text-monospace.bg-soft-success').text()) !== null,
  );
  const mapStart = +new Date();
  const elementsMapped = elementsFiltered.map((el) => {
    const id = $(el).find('td:nth-child(1)').text();
    return {
      title: id,
      link: `${appendLink(source, LIVE_CALL_API)}?id=${id}`,
      timestamp:
        lastSeenToUnixTimestamp($(el).find('td.text-monospace.bg-soft-success').text()) || 0,
      parserName: 'node',
      requestOption: {
        body: `pos=${backfilledTimestamp}&doInit=1&systemId=${id}&sid=0&sessionKey=${sessionKey}`,
        headers: {
          cookie,
        },
        method: 'post',
      },
    };
  });
  const mapEnd = +new Date();
  Logger.info(
    `got ${elements.length} elements; filtered to ${elementsFiltered.length} elements in ${
      mapStart - filterStart
    } ms; mapped in ${mapEnd - mapStart} ms`,
  );
  return elementsMapped;
}

async function nodeHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  _data: string[],
  _backFilledTimestamp: number,
  _url: string,
  response: Response,
): Promise<Post[]> {
  const json: LiveCallResponse = JSON.parse(response.body);
  return json.calls.map(
    (x) => new Post(
      `${x.display} ${x.descr}`,
      {
        [METADATA.CURRENT_URL]: `${CALL_API}/${x.hash}/${x.systemId}/${x.filename}.${x.enc}`,
        [METADATA.VIA_SNS_TOPIC]: 'team_x_scanner_content_create',
      },
      x.meta_starttime,
      [],
      [],
      new Map(Object.entries(x)),
    ),
  );
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'status',
      selector: ['tbody tr'],
      handler: statusHandler,
    },
    {
      name: 'node',
      selector: ['*'],
      handler: nodeHandler,
    },
  ],
  BACKFILLED_MINUTE,
);
