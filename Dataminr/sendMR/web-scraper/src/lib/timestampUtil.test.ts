import moment from 'moment';
import {
  getDate,
  isRelativeTimestamp,
  lastSeenToUnixTimestamp,
  toUnixTimestamp,
} from './timestampUtil';

describe('Testing timestampUtil module', () => {
  describe('Test isRelativeTimestamp method', () => {
    it('should return true for relative timestamp', () => {
      expect(isRelativeTimestamp('1 minute')).toBeTruthy();
      expect(isRelativeTimestamp('54 minutes')).toBeTruthy();
      expect(isRelativeTimestamp('4 hours')).toBeTruthy();
    });

    it('should return false for absolute timestamp', () => {
      expect(isRelativeTimestamp('Yesterday, 06:08 PM')).toBeFalsy();
      expect(isRelativeTimestamp('Today, 06:08 PM')).toBeFalsy();
      expect(isRelativeTimestamp('11-25-2019, 01:18 PM')).toBeFalsy();
    });
  });

  describe('Test getDate method', () => {
    it('should return proper values', () => {
      expect(getDate('Yesterday, 06:08 PM')).toEqual(
        moment().subtract(1, 'd').format('MM-DD-YYYY'),
      );
      expect(getDate('Today, 06:08 PM')).toEqual(moment().format('MM-DD-YYYY'));
      expect(getDate('11-25-2019, 01:18 PM')).toEqual(moment().format('11-25-2019'));
      expect(() => getDate('4 minutes')).toThrow(/4 minutes/);
    });
  });

  describe('Test toUnixTimestamp method', () => {
    it('should return proper values', () => {
      expect(toUnixTimestamp('11-25-2019, 03:18 PM', 0)).toEqual(1574695080);
      expect(toUnixTimestamp('11-25-2019, 03:18 PM', 3)).toEqual(1574684280);
      expect(toUnixTimestamp('Today, 01:08 AM', 0)).toEqual(
        moment().utc().hour(1).minute(8)
          .second(0)
          .millisecond(0)
          .unix(),
      );
      expect(toUnixTimestamp('Yesterday, 11:08 AM', 0)).toEqual(
        moment().utc().subtract(1, 'd').hour(11)
          .minute(8)
          .second(0)
          .millisecond(0)
          .unix(),
      );
    });
  });

  describe('Test lastSeenToUnixTimestamp method', () => {
    it('should return proper values', () => {
      expect(lastSeenToUnixTimestamp('5 hours')).toEqual(null);
      expect(lastSeenToUnixTimestamp('5 hours ago')).toEqual(moment().subtract(5, 'hour').unix());
      expect(lastSeenToUnixTimestamp('5 hour ago')).toEqual(moment().subtract(5, 'hour').unix());
      expect(lastSeenToUnixTimestamp('5 sec ago')).toEqual(moment().subtract(5, 'second').unix());
      expect(lastSeenToUnixTimestamp('5 days ago')).toEqual(null);
    });
  });
});
