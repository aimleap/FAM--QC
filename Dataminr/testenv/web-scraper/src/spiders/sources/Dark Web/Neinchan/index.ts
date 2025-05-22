import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

import { boards } from './boards';
import { generateBoardLinks, postHandler } from '../../../../lib/4ChanUtil';

export const source: SourceType = {
  description: 'Malicious forums',
  isCloudFlare: true,
  name: 'Neinchan',
  type: SourceTypeEnum.FORUM,
  url: 'http://tdsrvhos656xypxsqtkqmiwefuvlyqmnvk5faoo23oh2m4xqg4gr47ad.onion/',
  expireIn: 400,
};

async function threadHandler(): Promise<ThreadType[]> {
  return generateBoardLinks(boards, 1, 5);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div.topBoards.title'],
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
