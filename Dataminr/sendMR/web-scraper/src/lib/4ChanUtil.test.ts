import { getNextPage, generateBoardLinks } from './4ChanUtil';

describe('Testing 4ChanUtil', () => {
  describe('Testing getNextPage', () => {
    it('it should pass', () => {
      expect(getNextPage('https://8kun.top/pnb/')).toEqual('https://8kun.top/pnb/2.html');
      expect(getNextPage('https://8kun.top/pnb/5.html')).toEqual('https://8kun.top/pnb/6.html');
      expect(getNextPage('https://8kun.top/pnb/16.html')).toEqual('');
    });
  });

  describe('Testing generateBoardLinks', () => {
    it('it should pass', () => {
      const expectValue = generateBoardLinks(['/index/'], 1, 7);
      expect(expectValue[0].title).toEqual('/index/');
      expect(expectValue[0].link).toEqual('/index/');
      expect(expectValue[0].parserName).toEqual('post');
      expect(expectValue[0].delay).toBeGreaterThanOrEqual(1000);
      expect(expectValue[0].delay).toBeLessThanOrEqual(7000);
    });
  });
});
