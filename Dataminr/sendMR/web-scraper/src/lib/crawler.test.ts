import { isTorUrl, skipProxy } from './crawler';

describe('Testing Crawler Module', () => {
  describe('Testing isTorUrl method', () => {
    it('it should pass', () => {
      expect(isTorUrl('https://abc.onion')).toBeTruthy();
    });
    it('it should pass', () => {
      expect(isTorUrl('http://bdfcctess3zhicun.onion')).toBeTruthy();
    });
    it('it should pass', () => {
      expect(isTorUrl('http://abc.net')).toBeFalsy();
    });
  });

  describe('Testing skipProxy method', () => {
    it('it shall pass', () => {
      expect(skipProxy('https://careers.dataminr.com/engineering')).toBeTruthy();
      expect(skipProxy('https://proxy-server.dm.vpc:80')).toBeTruthy();
      expect(skipProxy('https://ecs-256-abuoi.amazonaws.com')).toBeTruthy();
      expect(skipProxy('https://api.keepersecurity.com/v2')).toBeTruthy();
      expect(skipProxy('https://abc.com')).toBeFalsy();
      expect(skipProxy('https://4chan.org')).toBeFalsy();
      expect(skipProxy('158.5.7.8')).toBeFalsy();
    });
  });
});
