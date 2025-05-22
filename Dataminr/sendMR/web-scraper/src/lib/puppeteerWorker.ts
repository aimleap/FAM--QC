import { Job } from 'bull';
import WorkerProcess from './workerProcess';
import logger from './logger';
import { JobStruct } from '../spiders/parsers/Parser';
import { getContext } from './logging/context';

export default class PuppeteerWorker extends WorkerProcess {
  process = async (task: Job) => {
    const { data } = task;
    const { url } = data;
    const jobId = task.id.toString();

    const sourceParser = await this.verify(task);

    logger.info(
      'processing puppeteer job',
      new JobStruct(task),
      getContext(parseInt(jobId.toString(), 10), url),
    );

    return sourceParser.parser.process(task);
  };
}
