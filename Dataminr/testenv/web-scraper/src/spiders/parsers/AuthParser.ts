import { Job } from 'bull';
import { Response } from 'request';
import _ from 'lodash';
import logger from '../../lib/logger';
import { getContext } from '../../lib/logging/context';
import {
  getAuthData, getAuthKey, setAuthData, SourceType,
} from '../../lib/parserUtil';
import { clearCacheCredential, getCredentialsByDomain, removeCredential } from '../../lib/keeper';
import { ErrorMessage } from '../../constants/errorMessage';
import struct from '../../lib/logging/struct';
import Parser, { getSelectorFromResponse, ParserStruct, ResponseTuple } from './Parser';
import { getResponse } from '../../lib/crawler';

export type isAuthenticatedCallback = (
  $: CheerioSelector,
  options: object,
  response: Response,
) => boolean;
export type authenticateCallback = (username: string, password: string) => Promise<object>;

const JobStruct = struct('Job');

export default class AuthParser extends Parser {
  private readonly isAuthenticated: isAuthenticatedCallback | undefined;

  private readonly authenticate: authenticateCallback | undefined;

  constructor(
    source: SourceType,
    parsers: ParserStruct[],
    backFilledMinutes: number,
    isAuthenticated?: isAuthenticatedCallback,
    authenticate?: authenticateCallback,
  ) {
    super(source, parsers, backFilledMinutes);
    this.isAuthenticated = isAuthenticated;
    this.authenticate = authenticate;
  }

  hasAuthentication = () => typeof this.isAuthenticated === 'function' && typeof this.authenticate === 'function';

  requestAuthentication = async () => {
    const credentials = await getCredentialsByDomain(this.source.url);
    if (credentials.length === 0) throw new Error(`no credentials available for ${this.source.name}`);

    const randomCredential = credentials[_.random(0, credentials.length - 1)];
    try {
      // @ts-ignore
      const authData = await this.authenticate(randomCredential.login, randomCredential.password);
      // TODO: proxy url and enable sticky sessions for authentication crawlers
      await setAuthData(getAuthKey(this.source), authData);
    } catch (err: any) {
      if (err.message.indexOf(ErrorMessage.INVALID_CREDENTIAL) === -1) throw err;
      if (await removeCredential(randomCredential)) {
        await clearCacheCredential();
      }
    }
  };

  getRequestOption = async (): Promise<object> => {
    const authKey = getAuthKey(this.source);
    const options = await getAuthData(authKey);
    const { requestOption = {} } = this.source;

    return {
      ...options,
      ...requestOption,
    };
  };

  getAuthSelector = async (url: string, task: Job): Promise<ResponseTuple> => {
    let options = await this.getRequestOption();
    // @ts-ignore
    let response = await getResponse(
      { method: 'get', ...options, url },
      this.source.isCloudFlare,
      this.source.name,
    );
    // @ts-ignore
    let $ = getSelectorFromResponse(response, options && options.encoding);
    let retries = 0;

    /* eslint-disable no-await-in-loop */
    // @ts-ignore
    while (_.isEmpty(options) || !this.isAuthenticated($, options, response)) {
      if (retries > 2) {
        logger.warn(
          'failed to authenticate',
          new JobStruct(task),
          getContext(parseInt(task.id.toString(), 10), '0'),
        );
        throw new Error('failed to authenticate');
      }

      await this.requestAuthentication();
      options = await this.getRequestOption();

      // @ts-ignore
      response = await getResponse({ ...options, url }, this.source.isCloudFlare, this.source.name);
      // @ts-ignore
      $ = getSelectorFromResponse(response, options && options.encoding);
      retries += 1;
    }
    /* eslint-enable no-await-in-loop */
    return {
      $,
      response,
    };
  };

  /* Override */
  getDocumentSelector = async (
    task: Job,
    response: Response,
    options: any,
  ): Promise<ResponseTuple> => {
    // @ts-ignore
    if (this.hasAuthentication()) return this.getAuthSelector(response.request.uri.format(), task);
    return {
      $: getSelectorFromResponse(response, options && options.encoding),
      response,
    };
  };
}
