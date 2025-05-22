import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redisRateLimit } from './redis';
import logger from './logger';

export default class RateLimit {
  private rateLimiter: RateLimiterRedis | null;

  private readonly name: string;

  private readonly points: number;

  private readonly duration: number;

  /**
   *
   * @param name unique rate limiter name
   * @param points how many points to consume per request
   * @param duration in seconds
   */
  constructor(name: string, points: number, duration: number) {
    this.rateLimiter = null;
    this.name = name;
    this.points = points;
    this.duration = duration;
  }

  initialize = async () => {
    if (this.rateLimiter !== null) return false;

    return new Promise((fulfilled) => {
      redisRateLimit.on('ready', () => {
        // https://github.com/animir/node-rate-limiter-flexible/wiki/Options
        this.rateLimiter = new RateLimiterRedis({
          storeClient: redisRateLimit,
          points: this.points,
          duration: this.duration,
          blockDuration: 0,
          keyPrefix: `Rate_Limit_${this.name}`,
        });
        logger.info(`Successfully initialized Rate Limiter for ${this.name}`);
        fulfilled(true);
      });
    });
  };

  /*
  * RateLimiterRes = {
      msBeforeNext: 250, // Number of milliseconds before next action can be done
      remainingPoints: 0, // Number of remaining points in current duration
      consumedPoints: 5, // Number of consumed points in current duration
      isFirstInDuration: false, // action is first in current duration
    }
  * */
  isAllowed = async (uniqueKey: string, point: number = 1): Promise<[boolean, RateLimiterRes]> => {
    try {
      if (this.rateLimiter === null) await this.initialize();
      // @ts-ignore
      const res = await this.rateLimiter.consume(uniqueKey, point);
      return [true, res];
    } catch (e) {
      if (e instanceof Error) throw e;
      // @ts-ignore
      return [false, e];
    }
  };
}
