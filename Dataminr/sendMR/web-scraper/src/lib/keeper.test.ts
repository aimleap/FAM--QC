import { getDomain } from './keeper';

describe('Testing keeper modules', () => {
  describe('Testing getDomain method', () => {
    it('it should return proper values', () => {
      expect(getDomain('https://google.com:8080')).toEqual('google.com');
      expect(getDomain('http://google.com')).toEqual('google.com');
      expect(getDomain('https://google.com/abc')).toEqual('google.com');
      expect(getDomain('http://darkmarket.onion')).toEqual('darkmarket.onion');
    });
  });
});
