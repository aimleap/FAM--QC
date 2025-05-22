// @ts-ignore
import logger from './logger';

process.on('uncaughtException', (err: Error) => {
  logger.error(`uncaught exception:  ${err.message} `, err);
  process.exit(1);
});

// @ts-ignore
process.on('unhandledRejection', (err: Error) => {
  logger.error(`unhandled rejection: ${err.message} `, err);
  process.exit(1);
});
