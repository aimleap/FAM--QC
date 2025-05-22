import cheerio from 'cheerio';
import Logger from './logger';
import { getResponse } from './crawler';
import { ErrorMessage } from '../constants/errorMessage';
import { source } from '../spiders/sources/EA/GabGroupSearch';

export const authenticateGab = async (username: string, password: string, sourceUrl: string) => {
  Logger.info(`Attempt to login to Gab with ${username}`);

  const initialResponse = await getResponse(
    {
      url: `${sourceUrl}auth/sign_in`,
      method: 'GET',
    },
    true,
    source.name,
  );

  const { body, headers } = initialResponse;

  if (body === undefined || headers === undefined) {
    Logger.warn(`failed to get initial login for ${sourceUrl}`);
    return {};
  }
  const $ = cheerio.load(body);
  const token = $('meta[name^="csrf-token"]').attr('content');
  const sessionCookie = initialResponse.headers['set-cookie'];

  const postResponse = await getResponse(
    {
      url: `${sourceUrl}auth/sign_in`,
      method: 'POST',
      // @ts-ignore
      form: {
        'user[email]': username,
        'user[password]': password,
        authenticity_token: token,
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie,
      },
    },
    true,
    source.name,
  );
  if (postResponse.headers['set-cookie'] === undefined) return {};
  if (postResponse.body.indexOf('invalid username/password') !== -1) {
    Logger.warn(`invalid credential username: ${username}`);
    throw new Error(ErrorMessage.INVALID_CREDENTIAL);
  }

  return {
    headers: {
      cookie: postResponse.headers['set-cookie'],
    },
  };
};
