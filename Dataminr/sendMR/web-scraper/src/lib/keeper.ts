// @ts-ignore
import { promisify } from 'util';
import Url from 'url';
import { execute } from './command';
import { redisClient } from './redis';
import logger from './logger';
import Credential from './logging/credential';
import { getContext } from './logging/context';

export interface KeeperFolder {
  folder: string;
}
/* eslint-disable camelcase */
export interface KeeperCredential {
  custom_fields: object;
  folders?: KeeperFolder[];
  login: string;
  login_url: string;
  notes: string;
  password: string;
  title: string;
  uid: string;
}

/* eslint-enable camelcase */

export const KEEPER_VAULT_KEY = 'KEEPER_VAULT';
export const SHARE_FOLDER_REGEX = /^Internal Scraping/;

// @ts-ignore
export const parseKeeperJson = (result: string): KeeperCredential[] => {
  try {
    const json = JSON.parse(result);
    if (!Array.isArray(json)) {
      // Keeper return as Object if account has share folders
      if (json.records) return json.records;
      logger.warn('Keeper Response is not an array');
      return [];
    }
    return json;
  } catch (err) {
    logger.warn('failed to parse json ', err);
    return [];
  }
};

export const cacheCredentials = async (
  credentialMap: Map<String, KeeperCredential[]>,
): Promise<void> => {
  if (credentialMap.size === 0) {
    logger.warn('Failed to cache credentials in Keeper, because it has no creds');
    return;
  }

  await promisify(redisClient.set).call(
    redisClient,
    KEEPER_VAULT_KEY,
    JSON.stringify(Object.fromEntries(credentialMap.entries())),
  );
  await promisify(redisClient.expire).call(redisClient, KEEPER_VAULT_KEY, 900);
  logger.info('Successfully cached credentials in redis');
};

export const getKeeperCredentials = async (): Promise<KeeperCredential[]> => {
  try {
    const result = await execute(
      'keeper --config=./config/keeper.json export --format json',
      false,
    );
    const firstBracket = result.indexOf('{');
    const lastBracket = result.lastIndexOf('}');
    const json = `{${result.substring(firstBracket + 1, lastBracket)}}`;
    return parseKeeperJson(json);
  } catch (err) {
    logger.warn('failed to get credentials through keeper vault ', err);
    return [];
  }
};

export const getDomain = (url: string) => Url.parse(url).hostname;

export const toCredentialMap = (
  credentials: KeeperCredential[],
): Map<string, KeeperCredential[]> => {
  const credentialMap = new Map();
  credentials.forEach((cred) => {
    if (!cred.login_url || !cred.password || !cred.login) return;

    const domain = getDomain(cred.login_url);

    if (!credentialMap.has(domain)) {
      credentialMap.set(domain, [cred]);
    } else {
      credentialMap.get(domain).push(cred);
    }
  });
  return credentialMap;
};

// @ts-ignore
export const getCacheCredentials = async (): Promise<Map<string, KeeperCredential[]>> => {
  try {
    const result = await promisify(redisClient.get).call(redisClient, KEEPER_VAULT_KEY);

    if (typeof result !== 'string') {
      logger.info('Keeper credentials is not cached in Redis');
      return new Map();
    }

    const json = JSON.parse(result);

    logger.info('successfully retrieved credentials in cache');
    return new Map(Object.entries(json));
  } catch (err) {
    logger.warn('failed to get credentials in redis ', err);
    return new Map();
  }
};

export const getDarkWebCredentials = (credentials: KeeperCredential[]) => credentials.filter(
  (cred) => cred.folders
      && cred.folders.some(
        // @ts-ignore
        (c) => c.shared_folder && c.shared_folder.search(SHARE_FOLDER_REGEX) !== -1,
      ),
);

export const getCredentials = async (): Promise<Map<string, KeeperCredential[]>> => {
  try {
    const cache = await getCacheCredentials();
    if (cache.size > 0) return cache;

    const credentials: KeeperCredential[] = await getKeeperCredentials();
    const darkWebCredentials = getDarkWebCredentials(credentials);
    const credentialMap = toCredentialMap(darkWebCredentials);
    await cacheCredentials(credentialMap);

    return credentialMap;
  } catch (err) {
    logger.warn('failed to get keeper credentials in cache/keeper ', err);
    return new Map();
  }
};

export const getCredentialsByDomain = async (url: string): Promise<KeeperCredential[]> => {
  try {
    const credentialMap = await getCredentials();
    const domain = Url.parse(url).hostname || '';
    if (!credentialMap || !credentialMap.has(domain)) return [];
    return credentialMap.get(domain) || [];
  } catch (err) {
    logger.warn(`failed to get credential for ${url} `, err, getContext(0, url));
    return [];
  }
};

export const removeCredential = async (credential: KeeperCredential): Promise<boolean> => {
  try {
    await execute(`yes | keeper --config=./config/keeper.json  rm ${credential.uid}`, false);
    logger.info('Successfully removed credential', new Credential(credential));
    return true;
  } catch (err) {
    logger.warn('failed to remove credential ', err, new Credential(credential));
    return false;
  }
};

// @ts-ignore
export const clearCacheCredential = async () => promisify(redisClient.del).call(redisClient, KEEPER_VAULT_KEY);
