import { redisClient } from './redis';
import { Logger } from './logger';
import { getResponse } from './crawler';
import { source } from '../spiders/sources/EA/Chirpwire';

const CHIRPWIRE_COOKIE = 'CHIRPWIRE_COOKIE';
const CHIRPWIRE_COOKIE_TTL = 1800; // store session cookies for 30 minutes

export interface ChirpwireCredentials {
  email: string;
  password: string;
}

export interface ChirpwireQuery {
  query: string;
}

export interface ChripwireConfig {
  authentication: ChirpwireCredentials;
  queries: ChirpwireQuery[];
}

const storeAuthCookie = async (authCookie: object): Promise<void> => {
  Logger.info('Storing Chirpwire auth cookie');
  await redisClient.set(CHIRPWIRE_COOKIE, JSON.stringify(authCookie));
  await redisClient.expire(CHIRPWIRE_COOKIE, CHIRPWIRE_COOKIE_TTL);
};

const retrieveAuthCookie = async (): Promise<object | null> => {
  const cookie = await redisClient.get(CHIRPWIRE_COOKIE);
  if (cookie === null) return null;
  Logger.info('Successfully retrieved Chirpwire auth cookie from cache');
  return JSON.parse(cookie);
};

const requestAuthCookie = async (username: string, password: string): Promise<object> => {
  const authResponse = await getResponse(
    {
      url: `${source.url}native_api/auth/login`,
      method: 'POST',
      headers: {
        authority: 'chirpwire.net',
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      },
      body: `email=${username}&password=${password}`,
    },
    false,
    source.name,
  );
  const { headers } = authResponse;
  const cookie = headers['set-cookie'];
  if (cookie === undefined) return {};
  Logger.info('Successfully requested Chirpwire auth cookie');
  const cookieObject = {
    headers: {
      cookie,
      authority: 'chirpwire.net',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
  };
  await storeAuthCookie(cookieObject);
  return cookieObject;
};

export const generateOrGetCookieHeader = async (
  username: string,
  password: string,
): Promise<object> => {
  const cookie = await retrieveAuthCookie();
  if (cookie === null) return requestAuthCookie(username, password);
  return cookie;
};
