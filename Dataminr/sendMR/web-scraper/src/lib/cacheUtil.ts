import { redisClient } from './redis';
import { getSourceConfigById, getSources } from './api/middleware';
import logger from './logger';

export const getSourceKey = (sourceName: string) => `SOURCE_CONFIG_${sourceName}`;

export async function getLatestConfig(
  sourceName: string,
  expiredIn: number = 300,
  force: boolean = false,
): Promise<null | object> {
  const key = getSourceKey(sourceName);

  if (!force) {
    const result = await redisClient.get(key);
    if (result !== null && typeof result === 'string') return JSON.parse(result);
  }

  const sources = await getSources(sourceName);

  const source = sources.find((x) => x.name === sourceName);

  if (source === undefined) {
    logger.warn(`${sourceName} doesn't exist in config api`);
    return null;
  }

  const config = await getSourceConfigById(source.id);

  if (config.length === 0) {
    logger.warn(`${sourceName} has no configurations`);
    return null;
  }

  const latestConfig = config[config.length - 1].data;

  if (expiredIn === -1) {
    await redisClient.pipeline().set(key, latestConfig).persist(key).exec();
  } else {
    // 5 min cache in redis
    await redisClient.pipeline().set(key, latestConfig).expire(key, expiredIn).exec();
  }

  return JSON.parse(latestConfig);
}
