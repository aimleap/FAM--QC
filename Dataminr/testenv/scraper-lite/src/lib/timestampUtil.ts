import moment from 'moment';
import momentTimeZone from 'moment-timezone';

export interface DATE {
  year: number;
  month: number;
  day: number;
}

export interface TIME {
  hour: number;
  minute: number;
}

const MONTH_MAP = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

/**
 * this method is to extract year/month/day from a date format input
 * @param timestamp {string} input date format
 * @param pattern {RegExp} regex matching of year/month/day
 * @return number year/month/day number
 */
export function regexDate(timestamp: String, pattern: RegExp): number {
  const match = timestamp.match(pattern);
  return Array.isArray(match) && match.length > 0 ? parseInt(match[0], 10) : 0;
}

/**
 * this method is to extract TIME from a date format input
 * @param timestamp {string} date input for example: 2020-10-16 10:30 am etc ...
 * @return {null|TIME} return TIME structure if parse successfully otherwise null
 */
export function getTime(timestamp: string): null | TIME {
  let hour = 0;
  let minute = 0;
  const match = timestamp.match(/(\d{1,2}):(\d{2})\s*([a|p]?m?)/i);

  if (match === null || match.length < 3) return null;

  hour = parseInt(match[1], 10);
  minute = parseInt(match[2], 10);

  if (match.length === 4) {
    const ampm = match[3];
    if (ampm === 'pm' && hour !== 12) hour += 12;
    else if (ampm === 'am' && hour === 12) hour = 0;
  }

  return { hour, minute };
}

/**
 * this method is to get date from timestamp input
 * @param timestamp {string} timestamp input
 * @return {null|DATE} return DATE if parse successfully otherwise null
 */
export function getDate(timestamp: string): null | DATE {
  let year = 0;
  let month = 0;
  let day = 0;
  let temp = '';

  // YYYY MM DD
  let match = timestamp.match(/\d{4}[-/.]\d{2}[-/.]\d{2}/);

  // MM DD YYYY
  if (match === null) match = timestamp.match(/\d{2}[-/.]\d{2}[-/.]\d{4}/);

  if (match !== null && match.length > 0) {
    year = regexDate(match[0], /\d{4}/);
    // 2014-05-10 => -05-10
    temp = match[0].replace(year.toString(), '');
    match = temp.match(/(\d{2})[-/.](\d{2})/);

    if (match !== null && match.length > 2) {
      month = parseInt(match[1], 10);
      day = parseInt(match[2], 10);

      const shouldFlip = moment.utc(`${year}-${month}-${day}`, 'YYYY-M-D').subtract(1, 'd').unix() > moment().unix();
      // Flip between month & day
      return month > 12 || shouldFlip ? { year, month: day, day: month } : { year, month, day };
    }
  }

  // Dec 3, 2020 or December 3, 2020
  match = timestamp.toLocaleLowerCase().match(/(\w*)\s+(\d{1,2}),?\s+(\d{4})/);

  if (match !== null && match.length > 3) {
    year = parseInt(match[3], 10);
    day = parseInt(match[2], 10);
    month = MONTH_MAP.indexOf(match[1].substring(0, 3)) + 1;
    // not found
    if (month === 0) return null;
    return { year, month, day };
  }

  // 3 Dec, 2020 or 3 December, 2020
  match = timestamp.toLocaleLowerCase().match(/(\d{1,2})\s(\w*)+,?\s+(\d{4})/);

  if (match !== null && match.length > 3) {
    year = parseInt(match[3], 10);
    day = parseInt(match[1], 10);
    month = MONTH_MAP.indexOf(match[2].substring(0, 3)) + 1;
    // not found
    if (month === 0) return null;
    return { year, month, day };
  }

  // Today or Yesterday
  if (timestamp.search(/today/i) !== -1) {
    const now = moment();
    return {
      year: now.year(),
      month: now.month() + 1,
      day: now.date(),
    };
  }

  if (timestamp.search(/yesterday/i) !== -1) {
    const now = moment().subtract(1, 'day');
    return {
      year: now.year(),
      month: now.month() + 1,
      day: now.date(),
    };
  }

  return null;
}

/**
 * This method is to parse relative timestamp
 * @param timestamp {string} relative timestamp input
 * @return {number} return unix timestamp if parse successfully otherwise 0
 */
export function parseRelativeTimestamp(timestamp: string): number {
  const relative = ['second', 'minute', 'hour', 'day', 'week', 'month'];

  for (const unit of relative) {
    const regex = new RegExp(`(\\d+)\\s${unit}s?\\sago`, 'i');
    const match = timestamp.match(regex);
    if (match !== null && match.length > 1) {
      // @ts-ignore
      return moment().utc().subtract(parseInt(match[1], 10), unit).unix();
    }
  }

  return 0;
}

/**
 * this method is to parse timestamp regardless if it's relative or not
 * @param timestamp {string} timestamp input
 * @return {number} return unix timestamp
 */
export function parseTimestamp(timestamp: string): number {
  if (timestamp === null || timestamp === undefined || timestamp.length === 0) return 0;

  const relativeTimestamp = parseRelativeTimestamp(timestamp);
  if (relativeTimestamp > 0) return relativeTimestamp;

  const date = getDate(timestamp);
  let time = getTime(timestamp);

  if (date === null) return 0;

  if (time === null) {
    time = {
      hour: 0,
      minute: 0,
    };
  }

  return moment
    .utc(`${date.year}-${date.month}-${date.day} ${time.hour}:${time.minute}`, 'YYYY-MM-DD HH:mm')
    .unix();
}

/**
 * to adjust timezone to UTC unix timestamp
 * @param dateTime dateTime must be in this format YYYY-MM-DD hh:mm A
 * @param timeZone time zone string
 * @return unix timestamp
 */
export function adjustTimezone(dateTime: string, timeZone: string = ''): number {
  const zone = momentTimeZone.tz.zone(timeZone);
  const timestamp = momentTimeZone.utc(dateTime, 'YYYY-MM-DD hh:mm A');
  const offset = timestamp.tz(timeZone).utcOffset();
  return zone !== null && timestamp.isValid() ? timestamp.add(offset * -1, 'minute').unix() : 0;
}
