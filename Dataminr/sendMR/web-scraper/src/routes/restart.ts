// @ts-ignore
import config from 'config';
import { Router } from 'express';
import { HttpStatus } from 'http-core-constants';
import Logger from '../lib/logger';
import {
  getDeployments, getPipelineJobs, getRestartJob, triggerJob,
} from '../lib/api/gitlab';

const { api: { restart = '' } = {} } = config;
const router = Router();

router.post('/', async (req, res) => {
  try {
    const { headers } = req;
    const authHeader: string = headers.authorization || '';

    if (
      authHeader.trim().length === 0
      || authHeader.search(/Basic [\S.]+/) === -1
      || authHeader.split(' ')[1] !== restart.api_key
    ) {
      res.status(HttpStatus.FORBIDDEN).send("You're not allowed to access this resources");
      Logger.info('Unauthorized user tried to restart the service', JSON.stringify(headers));
      return;
    }

    const deployments = await getDeployments();
    if (deployments.length === 0) throw new Error("couldn't find deployment jobs");

    const pipelineJobs = await getPipelineJobs(deployments[0].deployable.pipeline.id);
    if (pipelineJobs.length === 0) throw new Error("couldn't find pipeline jobs");

    const restartJob = getRestartJob(pipelineJobs);
    if (restartJob === undefined) throw new Error("couldn't find the restart job");

    await triggerJob(restartJob.id);
    Logger.info(`triggering restart job ${restartJob.id}`);

    res.status(HttpStatus.ACCEPTED).send('service is pending restart');
  } catch (err) {
    Logger.error('fail to restart', err);
    res.status(HttpStatus.SC_INTERNAL_SERVER_ERROR).send('fail to restart the service');
  }
});

export default router;
