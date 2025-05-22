import { InfluxDB } from 'influx';
// @ts-ignore
import { influx_db as influxDbConfig } from 'config';
import logger from './logger';

const {
  database, host = '127.0.0.1', name, password = '', port, username = '',
} = influxDbConfig;

if (port === undefined || database === undefined || name === undefined) {
  logger.error(
    `missing required configuration port ${port} or database ${database} or name ${name}`,
  );
}

// @ts-ignore
const influx = new InfluxDB({
  database,
  host,
  password,
  port,
  username,
});

export const insert = async (
  measurement: string,
  fields: object,
  tags?: object | [],
): Promise<boolean> => {
  try {
    if (typeof fields !== 'object' || Object.keys(fields).length === 0) {
      throw new Error(`invalid fields ${fields}`);
    }

    let measurementTags: object | [] = {};

    if (Array.isArray(tags)) {
      measurementTags = [...tags];
    } else if (typeof tags === 'object' && Object.keys(tags).length > 0) {
      measurementTags = {
        ...tags,
      };
    }

    await influx.writePoints([
      {
        measurement: `${name}-${measurement}`,
        fields,
        // @ts-ignore
        tags: measurementTags,
      },
    ]);
    return true;
  } catch (err) {
    logger.warn(`failed to insert measurement into ${measurement} `, err);
    return false;
  }
};

export default influx;
