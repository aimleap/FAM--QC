import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { URL_PLACE_HOLDER } from '../../../../constants/url';
import {
  getProviderKey,
  PROXY_PROVIDER,
  ProxyInfo,
  removeProxies,
  stringifyProxy,
} from '../../../../lib/proxy/httpProxy';
import {
  getCountryKeys,
  getProxyMap,
  initializeWebShare,
} from '../../../../lib/proxy/proxyManager/webShare';
import logger from '../../../../lib/logger';
import { initializeBrightData } from '../../../../lib/proxy/proxyManager/brightData';

export const source: SourceType = {
  description: 'DIP Cron Job',
  isCloudFlare: false,
  name: 'Proxy Refresh',
  type: SourceTypeEnum.FORUM,
  url: URL_PLACE_HOLDER,
};

async function webShareRefresh() {
  const countryKeys = await getCountryKeys();
  const currentProxyMap = await getProxyMap(countryKeys);

  const updatedProxies = await initializeWebShare(true);

  const updatedProxyMap: Map<string, string> = new Map();
  updatedProxies.forEach((p) => updatedProxyMap.set(p.username, stringifyProxy(p)));

  const removedProxies: string[] = [];

  // Remove all the outdated proxies in country keys and web share provider key
  currentProxyMap.forEach((v, k) => {
    if (!updatedProxyMap.has(k)) {
      v.forEach((x) => removedProxies.push(x));
    } else {
      v.forEach((k) => {
        if (updatedProxyMap.get(k) === k) {
          removedProxies.push(k);
        }
      });
    }
  });

  const jsonProxies = removedProxies
    .map((p) => JSON.parse(p) as ProxyInfo)
    .map((p) => stringifyProxy(p));

  if (removedProxies.length === 0) return [];

  logger.info(
    `Removing the follow keys in Web Share Proxies ${removedProxies
      .map((x) => JSON.parse(x).username)
      .join(', ')}`,
  );

  return Promise.all([
    removeProxies(getProviderKey(PROXY_PROVIDER.Web_Share), jsonProxies),
    ...countryKeys.map((c) => removeProxies(c, jsonProxies)),
  ]);
}

export async function refresh() {
  await initializeBrightData(true);
  await webShareRefresh();
  return [];
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'refresh',
      selector: ['*'],
      handler: refresh,
    },
  ],
  20,
);
