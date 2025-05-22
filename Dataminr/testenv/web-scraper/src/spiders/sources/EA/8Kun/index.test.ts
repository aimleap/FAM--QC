import { getNextPage } from './index';

describe('Testing 8Kun', () => {
  describe('Testing getNextPage', () => {
    it('it should pass', () => {
      expect(getNextPage('https://8kun.top/pnb/')?.link).toEqual('https://8kun.top/pnb/2.html');
      expect(getNextPage('https://8kun.top/pnb/5.html')?.link).toEqual(
        'https://8kun.top/pnb/6.html',
      );
      expect(getNextPage('https://8kun.top/pnb/25.html')).toEqual(null);
    });
  });
});
