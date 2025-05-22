import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  ThreadType,
  SourceTypeEnum,
  appendLink,
  getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'ReadUs',
  type: SourceTypeEnum.FORUM,
  url: 'http://readusfc7mroxn2mahmbu5wjpyspokriixbfbleemugxbgowxqi7yhyd.onion',
  entryUrl: '/forumdisplay.php?fid=2',
};

export function getUnixTimestamp($: CheerioSelector, element: CheerioElement): number {
  const $element = $(element);

  // Clean up
  $element.remove('a');
  $element.remove('br');

  const timestamp = $element.text().trim();
  const match = timestamp.match(/\d{2}-\d{2}-\d{4}, \d{2}:\d{2} [A|P]M/);

  if (match !== null && match.length > 0) {
    return moment.utc(match[0], 'MM-DD-YYYY, hh:mm A').unix();
  }

  const date = $element.find('span[title]').attr('title');

  $element.remove('span');
  const time = $element.text();

  return moment.utc(`${date}${time}`, 'MM-DD-YYYY, hh:mm A').unix();
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const result = getThreadArray(
    $,
    elements,
    'span[id^="tid_"] a',
    'span[id^="tid_"] a',
    getUnixTimestamp,
  ).map((t) => ({ ...t, link: `/${t.link}` }));
  return result;
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
    try {
      const $el = $(el);
      const message = $el.find('.post_body').text().trim();
      const profileLink = $el.find('.author_information a').attr('href') || '';
      const profileName = $el.find('.author_information a').text();
      // @ts-ignore
      const timestamp = getUnixTimestamp($, $el.find('.post_date'));
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.post_head .float_right a').attr('href') || url,
            ),
          },
          timestamp,
          forumPaths,
        ),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['.inline_row'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.post.classic'],
      handler: postHandler,
    },
  ],
  35,
);
