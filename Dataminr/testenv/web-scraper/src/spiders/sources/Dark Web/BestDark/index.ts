import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  ThreadType,
  SourceTypeEnum,
  getThreadArray,
  appendLink,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'bestdark',
  type: SourceTypeEnum.FORUM,
  url: 'http://bdfcctess3zhicun.onion',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    '.title a',
    '.title a',
    ($html: CheerioSelector, element: CheerioElement): number => parseInt($html(element).find('.postDate time').attr('data-time') || '', 10),
  );
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
      const message = $el.find('.message-body .bbWrapper').text().trim();
      const profileLink = $el.find('.message-name a').attr('href') || '';
      const profileName = $el.find('.message-name a').text();
      const timestamp = parseInt($el.find('.message-attribution time').attr('data-time') || '', 10);
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.message-attribution-opposite a').attr('href') || url,
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
      selector: ['.tabGroup--threads .content li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.message'],
      handler: postHandler,
    },
  ],
  35,
);
