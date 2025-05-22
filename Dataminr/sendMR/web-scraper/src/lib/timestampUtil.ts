import moment from 'moment';

export const isRelativeTimestamp = (timestamp: string): boolean => timestamp.search(/\d{2}:\d{2}\s{1}(AM|PM)/) === -1;

export const getDate = (timestamp: string): string => {
  const parsedDate = timestamp.match(/yesterday|today|\d{2}-\d{2}-\d{4}/i);

  if (parsedDate === null || !parsedDate.length) throw new Error(`invalid timestamp input ${timestamp}`);

  if (parsedDate[0].toLowerCase() === 'yesterday') {
    return moment().subtract(1, 'd').format('MM-DD-YYYY');
  }
  if (parsedDate[0].toLowerCase() === 'today') return moment().format('MM-DD-YYYY');
  return parsedDate[0];
};

export const toUnixTimestamp = (timestamp: string, offset: number = 0): number => {
  const isRelative = isRelativeTimestamp(timestamp);
  const date = isRelative ? moment().utc().format('MM-DD-YYYY') : getDate(timestamp);

  if (!isRelative) {
    const ts = timestamp.match(/\d{2}:\d{2}\s+(AM|PM)/);
    if (ts === null) throw new Error(`invalid timestamp input ${timestamp}`);
    return moment.utc(`${date} ${ts[0]}`, 'MM-DD-YYYY hh:mm A').utcOffset(offset, true).unix();
  }

  const format = timestamp.search(/minute/i) !== -1 ? 'm' : 'h';
  // @ts-ignore
  const value = timestamp.match(/\d+/)[0];
  return moment().utc().subtract(value, format).unix();
};

export const UNIT_MAP = {
  sec: 'second',
  secs: 'second',
  second: 'second',

  min: 'minute',
  mins: 'minute',

  hour: 'hour',
  hours: 'hour',
};

export const lastSeenToUnixTimestamp = (timestamp: string): number | null => {
  const match = timestamp.match(/(\d)\s+(\w+)\s+(ago)/);

  if (match === null || match.length !== 4) return null;

  const [, amount, unit, ago] = match;

  if (ago.search(/ago/i) === -1) return null;

  // @ts-ignore
  if (UNIT_MAP[unit] === undefined) return null;

  // @ts-ignore
  return moment().subtract(parseInt(amount, 10), UNIT_MAP[unit]).unix();
};
