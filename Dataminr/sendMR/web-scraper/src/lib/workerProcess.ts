import { Job } from 'bull';
import { Parser, getParsers } from '../sources';
import { JobStruct } from '../spiders/parsers/Parser';
import logger from './logger';
import { getContext, setContext } from './logging/context';
import PuppeteerParserStealth from '../spiders/parsers/PuppeteerParserStealth';
import { puppeteerQueue } from './queue';

export default class WorkerProcess {
  private parserMap: Map<string, Parser> | undefined;

  createParserMap = async () => {
    const parserMap: Map<string, Parser> = new Map();
    const parserList = await getParsers();
    parserList.forEach((parser) => parserMap.set(parser.source.name, parser));
    return parserMap;
  };

  verify = async (task: Job) => {
    const { data, name } = task;
    const { url } = data;
    const jobId = task.id.toString();

    setContext(jobId.toString(), url);

    if (name === undefined || name.length === 0) {
      logger.warn(
        'unable to process this job',
        new JobStruct(task),
        getContext(parseInt(jobId.toString(), 10), url),
      );
      return Promise.reject();
    }

    if (this.parserMap === undefined) {
      this.parserMap = await this.createParserMap();
    }

    const sourceParser = this.parserMap.get(name);

    if (sourceParser === undefined || sourceParser === null) {
      logger.warn(
        'unable to locate a parser for the job',
        new JobStruct(task),
        getContext(parseInt(jobId.toString(), 10), url),
      );
      return Promise.reject();
    }

    return sourceParser;
  };

  process = async (task: Job) => {
    const { data } = task;
    const { url } = data;
    const jobId = task.id.toString();

    const sourceParser = await this.verify(task);

    if (sourceParser.parser instanceof PuppeteerParserStealth) {
      await puppeteerQueue.add(sourceParser.source.name, data);

      logger.info(
        'Adding job to puppeteer queue',
        new JobStruct(task),
        getContext(parseInt(jobId.toString(), 10), url),
      );

      return Promise.resolve();
    }

    logger.info(
      'processing job',
      new JobStruct(task),
      getContext(parseInt(jobId.toString(), 10), url),
    );

    return sourceParser.parser.process(task);
  };
}
