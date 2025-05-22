import { JobInformation } from 'bull';
import { Parser, getParsers } from './sources';
import {
  taskQueue, criticalMentionQueue, vkQueue, puppeteerQueue,
} from './lib/queue';
import { appendLink, RepeatOptions, SourceType } from './lib/parserUtil';
import { Application } from './constants/application';
import logger from './lib/logger';
import WorkerProcess from './lib/workerProcess';
import { uploadWorker } from './spiders/sources/EA/CriticalMentions';
import { uploadVKWorker } from './spiders/sources/EA/VK';
import { getLatestConfig } from './lib/cacheUtil';
import PuppeteerWorker from './lib/puppeteerWorker';

export const SCRAPER_CONFIG_NAME = 'Web Scraper Config';
const CRITICAL_MENTION_WORKER_NUMBER = 1;
const VK_WORKER_NUMBER = 1;
const WORKER_NUMBER = 100;
const PUPPETEER_WORKER_NUMBER = 1;

export interface ScraperConfig {
  [index: string]: {
    disable?: boolean;
    repeatOptions: RepeatOptions;
  };
}

export const isUniqueSourceNames = (data: SourceType[]) => {
  const lookup = new Set();
  return data.every((source: SourceType) => {
    if (lookup.has(source.name)) return false;
    lookup.add(source.name);
    return true;
  });
};

export const getUrl = (source: SourceType): string => (source.entryUrl !== undefined ? appendLink(source, source.entryUrl) : source.url);

/**
 * to remove old jobs that is no longer exist
 * @param parsersMap
 */
async function cleanUpOldJobs(parsersMap: Map<string, Parser>) {
  const repeatableJobsList: JobInformation[] = await taskQueue.getRepeatableJobs();

  /* Remove jobs that is no longer existed */
  const removeRepeatableJobs = repeatableJobsList.filter((x) => !parsersMap.has(x.name));
  return Promise.all(removeRepeatableJobs.map((x) => taskQueue.removeRepeatableByKey(x.key)));
}

async function addJobs(parser: Parser, config: ScraperConfig) {
  const { source } = parser;
  const { name } = source;
  const { repeatOptions } = config.hasOwnProperty(name) ? config[name] : { repeatOptions: {} };

  // every 1 hour as default
  const { delay = 0, cron }: RepeatOptions = repeatOptions;

  const options = {
    delay,
    repeat: cron !== undefined ? { cron } : { cron: '*/15 * * * *' },
  };

  logger.info(`scheduling job ${name} with options ${JSON.stringify(options)}`);
  return taskQueue.add(
    name,
    {
      url: getUrl(source),
      path: [],
    },
    Application.isLocalDev ? {} : options,
  );
}

async function upsertJobs(parsersMap: Map<string, Parser>): Promise<Promise<any>[]> {
  const repeatableJobsList: JobInformation[] = await taskQueue.getRepeatableJobs();
  const repeatableJobsMap: Map<string, JobInformation> = new Map();
  const config = (await getLatestConfig(SCRAPER_CONFIG_NAME)) as ScraperConfig;
  const insertJobs: Promise<any>[] = [];
  const removeJobs: Promise<any>[] = [];

  repeatableJobsList.forEach((x) => repeatableJobsMap.set(x.name, x));

  parsersMap.forEach((parser, name) => {
    // New sources
    if (!repeatableJobsMap.has(name) && parser !== null) {
      insertJobs.push(addJobs(parser, config));
      return;
    }

    // Update cron jobs from config API
    if (
      repeatableJobsMap.has(name)
      && config.hasOwnProperty(name)
      && repeatableJobsMap.get(name)?.cron !== config[name].repeatOptions.cron
    ) {
      insertJobs.push(addJobs(parser, config));
      // @ts-ignore
      removeJobs.push(taskQueue.removeRepeatableByKey(repeatableJobsMap.get(name)?.key));
      logger.info(
        `removing ${name} job with repeatable key ${repeatableJobsMap.get(name)?.key} from queue`,
      );
    }
  });

  return Promise.all([...removeJobs, ...insertJobs]);
}

async function initializeJobs() {
  try {
    const parsers = await getParsers();
    const parsersMap: Map<string, Parser> = new Map();
    const config = (await getLatestConfig(SCRAPER_CONFIG_NAME)) as ScraperConfig;
    parsers.forEach((p) => {
      // skip schedule job for this source if disable = true
      const sourceName = config[p.source.name];
      if (sourceName !== undefined && sourceName.disable !== undefined && sourceName.disable) {
        logger.info(`disable ${p.source.name} due to configuration`);
        return;
      }
      parsersMap.set(p.source.name, p);
    });

    await cleanUpOldJobs(parsersMap);
    await upsertJobs(parsersMap);
  } catch (e) {
    logger.error('failed to update job', e);
    throw e;
  }
}

async function scheduler() {
  try {
    const parsers = await getParsers();
    const sources = parsers.map(({ source }) => source);

    if (!isUniqueSourceNames(sources)) throw new Error('all source names must be unique');

    await initializeJobs();

    const worker = new WorkerProcess();
    taskQueue.process('*', WORKER_NUMBER, worker.process);

    const puppeteerWorker = new PuppeteerWorker();
    puppeteerQueue.process('*', PUPPETEER_WORKER_NUMBER, puppeteerWorker.process);

    // Critical Mention Upload Queue;
    criticalMentionQueue.process('*', CRITICAL_MENTION_WORKER_NUMBER, uploadWorker);

    // VK Image search Upload Queue;
    vkQueue.process('*', VK_WORKER_NUMBER, uploadVKWorker);
  } catch (err) {
    logger.error('failed to schedule task ', err);
    throw err;
  }
}

export default scheduler;
