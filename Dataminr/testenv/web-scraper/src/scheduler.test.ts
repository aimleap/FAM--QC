import { isUniqueSourceNames } from './scheduler';
import { SourceTypeEnum } from './lib/parserUtil';

describe('Testing Scheduler Module', () => {
  describe('Testing isUniqueSourceNames method', () => {
    it('it should be true', () => {
      expect(
        isUniqueSourceNames([
          {
            description: 'Hacking forums',
            isCloudFlare: false,
            name: 'Alfursan',
            repeatOptions: {},
            type: SourceTypeEnum.FORUM,
            url: 'https://www.x6x.net',
          },
          {
            description: 'Hacking forums',
            isCloudFlare: true,
            name: 'Migalki Club',
            type: SourceTypeEnum.FORUM,
            url: 'http://migalki.pw',
            repeatOptions: {},
          },
        ]),
      ).toBeTruthy();
    });

    it('it should be false', () => {
      expect(
        isUniqueSourceNames([
          {
            description: 'Hacking forums',
            isCloudFlare: false,
            name: 'Migalki Club',
            type: SourceTypeEnum.FORUM,
            url: 'https://www.x6x.net',
            repeatOptions: {},
          },
          {
            description: 'Hacking forums',
            isCloudFlare: true,
            name: 'Migalki Club',
            repeatOptions: {},
            type: SourceTypeEnum.FORUM,
            url: 'http://migalki.pw',
          },
        ]),
      ).toBeFalsy();
    });
  });
});
