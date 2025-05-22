import express from 'express';
import fs from 'node:fs/promises';
import logger from './lib/logger';
import { initialize } from './lib/aws/sns';
import scheduler, { SCRAPER_CONFIG_NAME } from './scheduler';
import router from './routes';
import './lib/initialize';
import { System } from './constants/system';
import { redisClient } from './lib/redis';
import { createBucket } from './lib/cdnUtils';
import { initialize as initializeKinesis } from './lib/aws/kinesis';
import { Application } from './constants/application';
import { createS3Bucket, isBucketExist, S3_ARCHIVE_BUCKET } from './lib/s3Archiver';
import { getLatestConfig } from './lib/cacheUtil';
import { isProxyInCache } from './lib/proxy/httpProxy';
import { initializeBrightData } from './lib/proxy/proxyManager/brightData';
import { initializeWebShare } from './lib/proxy/proxyManager/webShare';
import { initializeProxyServer } from './lib/proxy/proxyManager/proxyServer';
import { PROXY_SOURCE_CONFIG } from './lib/proxy/sourceProxy';

const app = express();
const port = process.env.PORT || 3000;
process.setMaxListeners(0);

const setup = async () => {
  try {
    await getLatestConfig(SCRAPER_CONFIG_NAME, -1, true);
    await getLatestConfig(PROXY_SOURCE_CONFIG, -1, true);
    logger.info('successfully initialized credentials');

    if (Application.isLocalDev) {
      await fs.rm('./output.json', { force: true });
      logger.info('removed local output file successfully');

      if (!(await isBucketExist(S3_ARCHIVE_BUCKET))) {
        await createS3Bucket(S3_ARCHIVE_BUCKET);
      }
    }

    await router(app);
    app.listen(port, () => logger.info(`Service is running on http://localhost:${port}`));

    if (process.env.USE_PROXY === 'true' && !(await isProxyInCache())) {
      await initializeBrightData(true);
      await initializeWebShare(true);
      await initializeProxyServer();
      logger.info('successfully initialized proxy');
    }

    await initialize();
    logger.info('application initialized');

    await createBucket();
    logger.info('successfully initialized s3 bucket');
    await initializeKinesis();
    logger.info('successfully initialized kinesis');

    await scheduler();
    logger.info('successfully scheduled tasks');
  } catch (e) {
    logger.error('failed to setup the server ', e);
    process.exit(1);
  }
};

setup().then();

export function gracefullyShutdown() {
  app.enabled(System.SHUT_DOWN_FLAG);
  setTimeout(async () => {
    redisClient.disconnect();
    process.exit(0);
  }, 15000);
}

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM');
  gracefullyShutdown();
});
