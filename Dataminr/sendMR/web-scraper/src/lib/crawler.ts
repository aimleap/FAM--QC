import { promisify } from 'util';
import Url from 'url';
import { Response } from 'request';
import request from 'request-promise';
// @ts-ignore
import cloudscraper from 'cloudscraper';
import { CloudflareError } from 'cloudscraper/errors';
import moment from 'moment';
import cheerio from 'cheerio';
import logger from './logger';
import { request as torRequest } from './request';
import Request, { extractInfo } from './logging/request';
import struct from './logging/struct';
import { getContext } from './logging/context';
import { insert } from './influxDB';
import { Metrics, MetricsNamesEnum } from '../constants/metrics';
import { vkTokenRotator } from './vkontakte/vkUtils';
import { VK_SEARCH_BASE_URL } from './vkontakte/constants';
import { getSourceProxyUrl } from './proxy/sourceProxy';

const Captcha = struct('Captcha');
const delay = promisify(setTimeout);
const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const SKIP_PROXY_URLS = new Set([
  'amazonaws.com',
  'api.criticalmention.com',
  'broadcastify.com',
  'dataminr.com',
  'dm.vpc',
  'fetchrss.com',
  'greynoise.io',
  'keepersecurity.com',
  'outsourcingserviceprovider.in',
  'cisa.gov',
]);

export function skipProxy(url: string): boolean {
  try {
    const urlObj = Url.parse(url);
    if (urlObj.hostname === null) return false;
    return Array.from(SKIP_PROXY_URLS).some((x) => urlObj.hostname?.search(x) !== -1);
  } catch (e) {
    logger.warn('failed to parse url', e);
    return false;
  }
}

export interface requestOption {
  encoding?: string;
  forceTor?: boolean;
  gzip?: boolean;
  method: string;
  rejectUnauthorized?: boolean;
  strictSSL?: boolean;
  url: string;
  headers?: any;
  body?: any;
  timeout?: number;
  proxy?: string;
}

/* eslint-disable camelcase */
export interface RequestThrottled {
  status_code: number;
  status_message: string;
  body: string;
  ip_address: string;
  cf_code: number;
}
/* eslint-enable camelcase */

export const getCaptchaProps = (error: Error): RequestThrottled => {
  const props: RequestThrottled = {
    status_code: 0,
    status_message: '',
    body: '',
    ip_address: '',
    cf_code: 0,
  };
  // @ts-ignore
  if (error.response) {
    // @ts-ignore
    const { statusCode, statusMessage, body } = error.response;
    const html = cheerio.load(body.toString() || '');
    // @ts-ignore
    props.status_code = statusCode;
    // @ts-ignore
    props.status_message = statusMessage;
    // @ts-ignore
    props.body = html('body').text().replace(/^\s+$/gm, '').trim();

    if (error instanceof CloudflareError) {
      props.cf_code = error.error;
    }

    // @ts-ignore
    const ipAddress = props.body.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

    // @ts-ignore
    // eslint-disable-next-line prefer-destructuring
    if (Array.isArray(ipAddress)) props.ip_address = ipAddress[0];
  }
  return props;
};

export const getRequestThrottledProps = (error: Error): RequestThrottled | null => {
  // @ts-ignore
  if (!error.response) return null;

  // @ts-ignore
  const { response } = error;
  const { statusCode } = response;
  if (
    (error instanceof Error && error.name.search(/captcha|cloudflare/i) !== -1)
    || statusCode === 429
    || statusCode === 403
  ) return getCaptchaProps(error);
  return null;
};

export function isTorUrl(url: string): boolean {
  const { host } = Url.parse(url);
  if (host === null) return false;
  return host.search(/.onion/) !== -1;
}

const getRequestInfo = (
  isCloudflare: boolean,
  option: requestOption,
  rep: Response,
  startTime: number,
): Request | null => extractInfo(isCloudflare, option, rep, startTime);

export const log = async (
  isCloudflare: boolean,
  option: requestOption,
  rep: Response,
  startTime: number,
) => {
  const req = getRequestInfo(isCloudflare, option, rep, startTime);
  if (req === null) return;

  await insert(
    Metrics.SOURCE_NAME_REQUEST_TIME,
    // @ts-ignore
    { value: req.props.latency },
    // @ts-ignore
    { domain: req.props.host },
  );

  const size = rep.headers['content-length'];

  if (size) {
    await insert(
      Metrics.SOURCE_NAME_RESPONSE_SIZE,
      {
        value: parseInt(size, 10),
      },
      {
        // @ts-ignore
        domain: req.props.host,
      },
    );
  }

  logger.info('', req, getContext(0, option.url));
};

/**
 * This method is to make a request
 * @param options {Object} options.url is required
 * @param isCloudflare {Boolean} [false] to use cloudflare bypass
 * @param sourceName {string} [''] to use for proxy config
 * @returns {Promise<null|any|{body}>}
 */
const getResponse = async (
  options: requestOption,
  isCloudflare: boolean = false,
  sourceName: string = '',
): Promise<Response> => {
  let resp = null;
  const startTime = moment().unix();
  try {
    /* eslint-disable prefer-const */

    let {
      url,
      method = 'GET',
      proxy = '',
      // @ts-ignore
      ...opt
    } = options;
    let token = '';

    /* eslint-enable prefer-const */

    if (proxy === '' && process.env.USE_PROXY === 'true' && !skipProxy(url)) {
      proxy = await getSourceProxyUrl(sourceName);
    }

    // apply token rotation
    if (url.startsWith(VK_SEARCH_BASE_URL)) {
      ({ url, token } = await vkTokenRotator(url));
    }
    const { forceTor } = options;
    // eslint-disable-next-line no-param-reassign
    delete options.forceTor;
    const isTor = forceTor || isTorUrl(url);

    if (url.trim().length === 0) {
      logger.warn('request url is undefined', getContext(0, url));
      throw new Error('request url is undefined');
    }

    if (isTor && !skipProxy(url)) {
      resp = await torRequest({
        url,
        method,
        ...opt,
        proxy: null,
      });
      await log(isCloudflare, options, resp, startTime);
      return resp;
    }

    if (isCloudflare) {
      resp = await cloudscraper({
        url,
        method,
        proxy,
        ...opt,
        resolveWithFullResponse: true,
      });
      await log(isCloudflare, options, resp, startTime);
      return resp;
    }

    const requestOptions = {
      url,
      method,
      proxy,
      ...opt,
      resolveWithFullResponse: true,
    };

    resp = await request(requestOptions);

    // we need to track vk response codes in order to check if we are getting rate limited
    if (url.startsWith(VK_SEARCH_BASE_URL)) {
      await insert(
        MetricsNamesEnum['vkontakte-CODE'],
        { value: 1 },
        {
          token,
          code: resp.statusCode,
        },
      );
    }
    await log(isCloudflare, options, resp, startTime);
    return resp;
  } catch (error: any) {
    // @ts-ignore
    const props = getRequestThrottledProps(error);
    if (props !== null) {
      logger.info(
        '',
        new Captcha({
          domain: Url.parse(options.url).host,
          url: options.url,
          method: options.method,
          ...props,
        }),
        getContext(0, options.url),
      );
    } else {
      logger.info('failed to get response ', error, options, getContext(0, options.url));
    }
    await log(isCloudflare, options, error.response, startTime);
    throw error;
  }
};

export { getResponse, delay, random };
