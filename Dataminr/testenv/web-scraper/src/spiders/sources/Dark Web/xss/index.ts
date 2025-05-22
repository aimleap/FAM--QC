import AuthParser from '../../../parsers/AuthParser';
import { appendLink, SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { getResponse } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';

import { ErrorMessage } from '../../../../constants/errorMessage';
import { postHandler, threadHandler } from '../../../frameworks/xenforo';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'xss',
  type: SourceTypeEnum.FORUM,
  url: 'https://xss.is/',
  entryUrl: '/whats-new/',
};

export const isAuthenticated = ($: CheerioSelector) => $('a[href="/account/"]').get().length === 2;

export const authenticate = async (username: string, password: string): Promise<object> => {
  Logger.info(`Attempt to login to ${source.name} with ${username}`);
  // @ts-ignore
  const initialResponse = await getResponse(
    {
      url: appendLink(source, '/login'),
      method: 'GET',
    },
    source.isCloudFlare,
    source.name,
  );

  // @ts-ignore
  const { body, headers } = initialResponse;

  if (body === undefined || headers === undefined) {
    Logger.warn(`failed to get initial login for ${source.url}`);
    return {};
  }

  const response = await getResponse(
    {
      method: 'POST',
      url: appendLink(source, '/login/login'),
      // @ts-ignore
      formData: {
        login: username,
        password,
        remember: 1,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // @ts-ignore
        cookie: initialResponse.request.headers.cookie,
      },
    },
    source.isCloudFlare,
    source.name,
  );

  if (response.body.indexOf('не найден') !== -1) {
    Logger.warn(`invalid credential username: ${username}`);
    throw new Error(ErrorMessage.INVALID_CREDENTIAL);
  }

  return {
    headers: {
      Cookie: response.request.headers.cookie,
    },
  };
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'threads',
      selector: ['.structItem'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.message'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
  isAuthenticated,
  authenticate,
);
