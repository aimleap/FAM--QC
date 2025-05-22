import {
  appendLink, SourceType, SourceTypeEnum, cleanString, pageGenerator,
} from './parserUtil';
import { URL_PLACE_HOLDER } from '../constants/url';

describe('Testing ParseUtil Module', () => {
  describe('Testing appendLink method', () => {
    it('appendLink should construct url properly', () => {
      const source: SourceType = {
        description: 'Hacking forums',
        isCloudFlare: true,
        name: 'WWH Club',
        type: SourceTypeEnum.FORUM,
        repeatOptions: {
          cron: '*/20 * * * *',
        },
        url: 'https://wwh-club.net/',
      };
      const source2: SourceType = {
        description: 'Hacking forums',
        isCloudFlare: true,
        name: 'WWH Club',
        type: SourceTypeEnum.FORUM,
        repeatOptions: {
          cron: '*/20 * * * *',
        },
        url: 'https://wwh-club.net',
      };
      expect(appendLink(source, '/abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source, '//abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source, 'abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source, 'http://wwh-club.net/hello')).toBe('http://wwh-club.net/hello');

      expect(appendLink(source2, '/abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source2, '//abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source2, 'abc')).toBe('https://wwh-club.net/abc');
      expect(appendLink(source2, 'http://wwh-club.net/hello')).toBe('http://wwh-club.net/hello');
      source2.url = URL_PLACE_HOLDER;
      expect(appendLink(source2, 'news.abc.com')).toBe('news.abc.com');
    });
  });
  describe('Testing clean String function', () => {
    it('should pass', () => {
      const testStringOne = 'Take Down the Need for Justice!<br /><br />Take Down the CCP href=\\"/tags/MAGA\\';
      const testStringTwo = 'Updates Virus Pandemic <br /><br />Mutant virus found to have mutated again in the UK';
      expect(cleanString(testStringOne)).toEqual(
        'Take Down the Need for Justice!Take Down the CCP',
      );
      expect(cleanString(testStringTwo)).toEqual(
        'Updates Virus Pandemic Mutant virus found to have mutated again in the UK',
      );
    });
  });
  describe('Testing pageGeneration function', () => {
    it('should pass', () => {
      const pages = 5;
      const pageArray = pageGenerator(1, pages, 1);
      expect(pageArray).toStrictEqual([1, 2, 3, 4, 5]);
    });
  });
});
