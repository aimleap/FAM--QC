// @ts-ignore
import { v4 as UuidV4 } from 'uuid';
import { putRecord } from './aws/kinesis';
import { ARCHIVER_TYPE } from '../constants/archiver';
import logger from './logger';
import Struct from './logging/struct';
import { getContext } from './logging/context';

export const ArchiveStruct = Struct('Archive');

export interface ArchiveData {
  id: string;
  type: ARCHIVER_TYPE;
  url: string;
  data: string;
}

export async function archive(
  type: ARCHIVER_TYPE,
  url: string,
  data: string,
  id: string = UuidV4(),
) {
  logger.info('archiving', new ArchiveStruct({ id, url, type }), getContext(0, url));
  return putRecord({
    id,
    type,
    url,
    data,
  });
}
