import { appendPaths } from './urlUtil';

describe('Testing Route Module', () => {
  describe('Testing appendPaths method', () => {
    it('it should pass', () => {
      expect(appendPaths(['http://gateway.com', 'abc'])).toEqual('http://gateway.com/abc');
      expect(appendPaths(['http://gateway.com', '/abc'])).toEqual('http://gateway.com/abc');
      expect(appendPaths(['http://gateway.com/', '/abc'])).toEqual('http://gateway.com/abc');
      expect(appendPaths(['http://gateway.com//', '//abc'])).toEqual('http://gateway.com/abc');
      expect(appendPaths(['http://gateway.com/', '/abc', '//health'])).toEqual(
        'http://gateway.com/abc/health',
      );
    });
  });
});
