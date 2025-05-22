import { Metrics } from '../constants/metrics';
import { insert } from './influxDB';

export async function recordSourceVolume(value: number, name: string) {
  return insert(
    Metrics.SOURCE_NAME_VOLUME,
    { value },
    {
      name,
    },
  );
}

export async function recordSourceVolumePostBackfilled(value: number, name: string) {
  return insert(
    Metrics.SOURCE_NAME_POST_BACKFILLED_VOLUME,
    { value },
    {
      name,
    },
  );
}

export async function recordParserTypeVolume(value: number, parserType: string) {
  if (value === null || Number.isNaN(value) || parserType.length === 0) return null;

  return insert(
    Metrics.PARSER_TYPE_VOLUME,
    { value: Math.trunc(value) },
    {
      parser_type: parserType,
    },
  );
}

export async function recordVolume(value: number = 1, sourceName: string, parserType: string) {
  return Promise.all([
    recordSourceVolume(value, sourceName),
    recordParserTypeVolume(value, parserType),
  ]);
}
