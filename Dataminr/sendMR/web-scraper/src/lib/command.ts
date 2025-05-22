import { exec } from 'child_process';
import logger from './logger';

export const execute = async (
  command: string,
  log: boolean = true,
  timeout: number = 120000,
): Promise<string> => new Promise((fulfill: Function, reject: Function) => {
  if (log) logger.info(`execute command ${command}`);
  exec(command, { timeout }, (err, stdout, stderr) => {
    if (err !== null) return reject(err);
    if (stderr.length && stderr !== '\r') return reject(stderr);
    return fulfill(stdout);
  });
});
