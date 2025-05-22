import { Express, Response, Request } from 'express';
import { promisify } from 'util';
// @ts-ignore
import { sns, redis } from 'config';
import { redisClient } from '../lib/redis';
import { getTopicArnMap } from '../lib/aws/sns';
import logger from '../lib/logger';
import { System } from '../constants/system';
import { isArchiverStreamUp } from '../lib/aws/kinesis';

const { port } = redis;

export default async function get(app: Express, req: Request, res: Response) {
  try {
    // TODO: do proxy check

    if (app.get(System.SHUT_DOWN_FLAG) === true) {
      logger.info('Gracefully shut down the service');
      res.status(503).send('gracefully shut down');
      return;
    }

    /* Check if it can write to redis */
    await promisify(redisClient.set).call(redisClient, 'health_check', 'true');

    if (getTopicArnMap().size !== sns.topics.length) {
      throw new Error('Required SNS topics are missing');
    }

    if (!(await isArchiverStreamUp)) {
      logger.error('Kinesis delivery stream archiver is down');
    }

    res.send("I'm up and running");
  } catch (err: any) {
    // Redis connection issue
    if (err.message.search(port) !== -1 && err.message.search(/connect/i) !== -1) {
      logger.error('failed to connect to Redis and restart in 30 sec');
      setTimeout(() => process.exit(1), 30000);
    }

    logger.error('failed health check ', err);
    res.status(503).send('Service is unavailable');
  }
}
