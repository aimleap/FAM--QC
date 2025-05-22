import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  appendLink,
  ThreadType,
  getPaginationThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'zloy',
  type: SourceTypeEnum.FORUM,
  url: 'https://forum.zloy.bz/',
  entryUrl: '/search.php?do=getdaily',
};

const getUnixTimestamp = (timestamp: string): number => {
  let day = 0;

  // Today
  if (timestamp.indexOf('Сегодня') === -1) day = 0;

  // Yesterday
  if (timestamp.indexOf('Вчера') === -1) day = 1;

  const time = timestamp.trim().match(/[\d]{2}:[\d]{2}/);

  if (!Array.isArray(time) || time.length === 0) return 0;

  const [hr, min] = time[0].trim().split(':');

  // Minus 3 hrs Moscow timezone
  return moment
    .utc()
    .hour(parseInt(hr, 10))
    .minute(parseInt(min, 10))
    .subtract(3, 'h')
    .subtract(day, 'd')
    .unix();
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getPaginationThreadArray(
    $,
    elements,
    'a[id^="thread_title"]',
    ['a[id^="thread_title"]', 'a[href*="page="]'],
    ($html: CheerioSelector, element: CheerioElement): number => getUnixTimestamp($html(element).find('td:nth-child(4)').text() || ''),
  ).map((t) => ({
    ...t,
    parserName: 'post',
  }));
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
      const message = $el.find('div[id^="post_message"]').text().trim();
      const profileLink = $el.find('.bigusername').attr('href') || '';
      const profileName = $el.find('.bigusername').text();
      const timestamp = getUnixTimestamp($el.find('.thead').text() || '');
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(source, $el.find('a[href*="postcount="]').attr('href') || url),
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
      selector: ['table tr'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['table[id^="post"]'],
      handler: postHandler,
    },
  ],
  35,
);
