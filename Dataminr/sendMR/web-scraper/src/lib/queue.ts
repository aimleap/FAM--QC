// @ts-ignore
import Bull, { JobInformation, Job } from 'bull';
import { REDIS_URL } from './redis';
import logger from './logger';
import struct from './logging/struct';
import { getContext } from './logging/context';
import { insert } from './influxDB';
import { QUEUE_METRICS, QUEUE_VOLUME } from '../constants/metrics';

export const TASK_QUEUE_NAME = 'DARK_WEB_CONTENT_TASK_QUEUE';
export const CRITICAL_MENTION_QUEUE_NAME = 'CRITICAL_MENTION_UPLOAD_QUEUE';
export const VK_QUEUE_NAME = 'VK_IMAGE_SEARCH_QUEUE';
export const PUPPETEER_NAME = 'PUPPETEER_QUEUE';

export const JobStruct = struct('Job');

// @ts-ignore
export function createQueue(queueName: string): Bull {
  return process.env.NODE_ENV !== 'test'
    ? new Bull(queueName, REDIS_URL, {
      settings: {
        lockDuration: 180000, // 3 min
        maxStalledCount: 3,
        retryProcessDelay: 30000, // 30 sec
      },
      defaultJobOptions: {
        backoff: {
          type: 'fixed',
          delay: 120000, // 2 min
        },
        timeout: 600000, // 10 min
        attempts: 2,
        removeOnComplete: 5000,
        removeOnFail: 20000,
      },
    })
    : {
      once: () => {},
      on: () => {},
      add: async (): Promise<Job | null> => null,
      process: async () => {},
      getRepeatableJobs: async (): Promise<JobInformation[]> => [],
      removeRepeatableByKey: async (): Promise<void> => {},
    };
}

export function addListener(queue: Bull.Queue) {
  const { name } = queue;

  queue.on('stalled', async (job) => {
    await insert(QUEUE_METRICS.JOB_STALLED, { value: 1 }, { name: job.name });
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'stalled' });
    // @ts-ignore
    logger.warn('stalled job ', new JobStruct(job), getContext(job.id, '0'));
  });

  queue.on('waiting', async (jobId) => {
    const job = await queue.getJob(jobId);

    if (job !== null) {
      await insert(QUEUE_METRICS.JOB_WAITING, { value: 1 }, { name: job.name });
    }

    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'waiting' });
  });

  queue.on('active', async (job) => {
    await insert(QUEUE_METRICS.JOB_ACTIVE, { value: 1 }, { name: job.name });
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'active' });
  });

  queue.on('removed', async (job) => {
    await insert(QUEUE_METRICS.JOB_REMOVED, { value: 1 }, { name: job.name });
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'removed' });
  });

  queue.on('progress', async (job) => {
    await insert(QUEUE_METRICS.JOB_PROGRESS, { value: 1 }, { name: job.name });
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'progress' });
  });

  queue.on('error', async (err) => {
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'error' });
    logger.warn('error job ', err);
  });

  queue.on('failed', async (job, err) => {
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'failed' });
    await insert(QUEUE_METRICS.JOB_FAILED, { value: 1 }, { name: job.name });
    await insert(
      QUEUE_METRICS.JOB_FAILED_PROCESSING_TIME,
      // @ts-ignore
      { value: job.finishedOn - job.processedOn },
      { name: job.name },
    );
    // @ts-ignore
    logger.warn('failed job ', err, new JobStruct(job), getContext(job.id, '0'));
  });

  queue.on('completed', async (job) => {
    await insert(QUEUE_METRICS.JOB_COMPLETED, { value: 1 }, { name: job.name });
    await insert(QUEUE_VOLUME, { value: 1 }, { queue: name, status: 'completed' });
    await insert(
      QUEUE_METRICS.JOB_COMPLETED_PROCESSING_TIME,
      // @ts-ignore
      { value: job.finishedOn - job.processedOn },
      { name: job.name },
    );
    // @ts-ignore
    logger.info(`job ${job.id} completed`, getContext(job.id, '0'));
  });
}

export const taskQueue: Bull.Queue = createQueue(TASK_QUEUE_NAME);
export const criticalMentionQueue: Bull.Queue = createQueue(CRITICAL_MENTION_QUEUE_NAME);
export const vkQueue: Bull.Queue = createQueue(VK_QUEUE_NAME);
export const puppeteerQueue: Bull.Queue = createQueue(PUPPETEER_NAME);

// @ts-ignore
addListener(taskQueue);
addListener(criticalMentionQueue);
addListener(vkQueue);
addListener(puppeteerQueue);
