import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

import { boards } from './boards';
import { generateBoardLinks, postHandler } from '../../../../lib/4ChanUtil';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: '8Chan',
  type: SourceTypeEnum.FORUM,
  url: 'https://8chan.moe',
  expireIn: 600,
};

async function threadHandler(): Promise<ThreadType[]> {
  return generateBoardLinks(boards, 1, 5);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['body'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[data-boarduri]'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
);
