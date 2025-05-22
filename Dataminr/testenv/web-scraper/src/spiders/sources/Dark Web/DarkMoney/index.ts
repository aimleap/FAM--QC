import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { postHandler, threadHandler } from '../../../frameworks/vBulletin';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Dark Money',
  type: SourceTypeEnum.FORUM,
  url: 'https://darkmoney.de',
  entryUrl: '/misc.php?show=latestposts&resultsnr=10',
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['#posts div'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
);
