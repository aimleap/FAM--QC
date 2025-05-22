import { getNextPage } from './index';

describe('Testing 4Chan', () => {
  describe('Testing getNextPage', () => {
    it('it should pass', () => {
      expect(getNextPage('https://boards.4channel.org/tv/')?.link).toEqual(
        'https://boards.4channel.org/tv/2',
      );
      expect(getNextPage('https://boards.4channel.org/tv/5')?.link).toEqual(
        'https://boards.4channel.org/tv/6',
      );
      expect(getNextPage('https://boards.4channel.org/tv/10')).toEqual(null);
    });
  });
});
