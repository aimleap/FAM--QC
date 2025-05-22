import moment from 'moment';
import {
  SourceType, SourceTypeEnum, ThreadType, getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'BaseTools',
  type: SourceTypeEnum.FORUM,
  url: 'https://basetools.sk/Explore',
  injectHeaders: true,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads = getThreadArray(
    $,
    elements,
    'div.widget-heading',
    'div.widget-heading a',
    (): number => moment().utc().unix(),
  ).map((t) => ({
    ...t,
    parserName: 'post',
    delay: (Math.floor(Math.random() * 15) + 1) * 1000,
  }));
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const text = $el.find('td:nth-child(3) > center').text().trim();
    const userName = $el.find('td:nth-child(4) > a').text().trim();
    const userUrl = $el.find('td:nth-child(4) > a').attr('href');
    const timestamp = moment().utc().unix();
    posts.push(
      new Post(
        text,
        {
          author_name: userName,
          author_url: userUrl,
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div.widget-content-left'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['tr.stufs-tabel'],
      handler: postHandler,
    },
  ],
  25,
);
