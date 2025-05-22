import moment from 'moment';
import {
  adjustTimezone, getDate, getTime, parseTimestamp,
} from './timestampUtil';
import { TIME_ZONE } from '../constants/timezone';

describe('Testing timestampUtilV2 module', () => {
  describe('Test getDate method', () => {
    it('it should pass', () => {
      expect(getDate('2020/05/26')).toEqual({
        year: 2020,
        month: 5,
        day: 26,
      });
      expect(getDate('2020-12-26')).toEqual({
        year: 2020,
        month: 12,
        day: 26,
      });
      expect(getDate('12-26-2017')).toEqual({
        year: 2017,
        month: 12,
        day: 26,
      });
      expect(getDate('26-05-2017')).toEqual({
        year: 2017,
        month: 5,
        day: 26,
      });
      expect(getDate('Dec 14, 2017')).toEqual({
        year: 2017,
        month: 12,
        day: 14,
      });
      expect(getDate('14 Dec, 2017')).toEqual({
        year: 2017,
        month: 12,
        day: 14,
      });
      expect(getDate('december 25, 2017')).toEqual({
        year: 2017,
        month: 12,
        day: 25,
      });
      const testYesterday = moment().subtract(1, 'day');
      expect(getDate('yesterday, 10:12 am')).toEqual({
        year: testYesterday.year(),
        month: testYesterday.month() + 1,
        day: testYesterday.date(),
      });
      expect(getDate('today, 10:12 am')).toEqual({
        year: moment().year(),
        month: moment().month() + 1,
        day: moment().date(),
      });
      expect(getDate('asdfasdd 25, 2017')).toEqual(null);
      expect(getDate('26-05')).toEqual(null);
    });
  });

  describe('Test getTime method', () => {
    it('it should pass', () => {
      expect(getTime('2020/05/26 12:09 am')).toEqual({
        hour: 0,
        minute: 9,
      });
      expect(getTime('2020/05/26 12:09 pm')).toEqual({
        hour: 12,
        minute: 9,
      });
      expect(getTime('2020/05/26 23:09')).toEqual({
        hour: 23,
        minute: 9,
      });
      expect(getTime('2020/05/26 00:57')).toEqual({
        hour: 0,
        minute: 57,
      });
      expect(getTime('2020/05/26 12:57 PM')).toEqual({
        hour: 12,
        minute: 57,
      });
      expect(getTime('2020/05/26 9:57')).toEqual({
        hour: 9,
        minute: 57,
      });
      expect(getTime('2020/05/26 23:0')).toEqual(null);
    });
  });

  describe('Test relative timestamp method', () => {
    it('it should pass', () => {
      const actual = moment().utc().subtract(10, 'seconds').unix();
      const expected = parseTimestamp('30 seconds ago');
      expect(actual - expected).toBeLessThanOrEqual(100);
    });
    it('it should pass', () => {
      const actual = moment().utc().subtract(30, 'minutes').unix();
      const expected = parseTimestamp('30 minutes ago');
      expect(actual - expected).toBeLessThanOrEqual(100);
    });
    it('it should pass', () => {
      const actual = moment().utc().subtract(2, 'months').unix();
      const expected = parseTimestamp('2 month ago');
      expect(actual - expected).toBeLessThanOrEqual(100);
    });
  });

  describe('Test adjustTimezone method', () => {
    it('before daylight saving', () => {
      const adjustTimestamp = adjustTimezone('2020-05-10 10:30 AM', TIME_ZONE['US/Eastern']);
      expect(adjustTimestamp).toEqual(1589121000);
    });
    it('after daylight saving', () => {
      const adjustTimestamp = adjustTimezone('2020-12-10 10:30 AM', TIME_ZONE['US/Eastern']);
      expect(adjustTimestamp).toEqual(1607614200);
    });
  });
});
