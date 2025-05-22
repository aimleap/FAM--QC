import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink,
  SourceType,
  ThreadType,
  SourceTypeEnum,
  getPaginationThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Turkz',
  type: SourceTypeEnum.FORUM,
  url: 'http://www.turkz.org/Forum',
  entryUrl: '/neler-yeni/mesajlar/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getPaginationThreadArray(
    $,
    elements,
    '.structItem-title a',
    ['.structItem-title a', '.structItem-pageJump a'],
    ($html: CheerioSelector, element: CheerioElement): number => parseInt($html(element).find('.structItem-latestDate').attr('data-time') || '', 10),
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
      $el.find('.bbCodeBlock').remove();
      const message = $el.find('article').text().trim();
      const profileLink = $el.find('.message-name a').attr('href') || '';
      const profileName = $el.find('.message-name a').text();
      const timestamp = parseInt(
        $el.find('.message-attribution-main time').attr('data-time') || '',
        10,
      );
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.message-attribution-opposite li:nth-child(2) a').attr('href') || url,
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
      selector: ['.structItem'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.message'],
      handler: postHandler,
    },
  ],
  25,
);
