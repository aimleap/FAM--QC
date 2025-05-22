import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import { postHandler, threadHandler } from '../../../frameworks/xenforo';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'reversing',
  type: SourceTypeEnum.FORUM,
  url: 'https://reversing.cc',
  entryUrl: '/whats-new/posts/',
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['.structItem'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.message'],
      handler: postHandler.bind(null, source),
    },
  ],
  35,
);
