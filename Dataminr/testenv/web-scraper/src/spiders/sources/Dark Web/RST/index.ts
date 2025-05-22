import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { postHandler, mainThreadHandler, threadHandler } from '../../../frameworks/IPB';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'RST Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://rstforums.com/forum',
  injectHeaders: true,
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main-thread',
      selector: ['.cForumRow.ipsDataItem'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['.ipsDataItem'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['article[id^="elComment"]'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
);
