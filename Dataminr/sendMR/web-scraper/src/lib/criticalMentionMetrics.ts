import { insert } from './influxDB';

export const streamMetrics = async (
  name: string,
  metric: string,
  value: number = 1,
): Promise<boolean> => insert(metric, { value }, { name });
