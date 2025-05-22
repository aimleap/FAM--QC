import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { postHandler, threadHandler } from '../../../frameworks/vBulletin';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Money Maker',
  type: SourceTypeEnum.FORUM,
  url: 'http://moneymaker.hk/',
  entryUrl: '/misc.php?show=latestposts&resultsnr=20',
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'threads',
      selector: ['a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['#posts .page'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
);
