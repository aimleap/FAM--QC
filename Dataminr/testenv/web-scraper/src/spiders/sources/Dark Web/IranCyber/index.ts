import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink,
  SourceType,
  ThreadType,
  SourceTypeEnum,
  getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Iran Cyber Group',
  type: SourceTypeEnum.FORUM,
  url: 'https://iran-cyber.net/forums',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  paths: string[],
  backFilledTimestamp: number,
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    '.VietXfAdvStats_ThreadTitle a',
    '.VietXfAdvStats_ThreadTitle a',
    (): number => backFilledTimestamp,
  ).map((t) => ({
    title: t.title.trim(),
    link: t.link,
    timestamp: t.timestamp,
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
      $el.find('blockquote .bbCodeBlock').remove();
      const message = $el.find('blockquote').text().trim();
      const profileLink = $el.find('.userText .username').attr('href') || '';
      const profileName = $el.find('.userText .username').text();
      const timestamp = parseInt($el.find('.DateTime').attr('data-time') || '', 10);
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(source, $el.find('.postnumber a').attr('href') || url),
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
      selector: ['.sectionMain .VietXfAdvStats_SectionItem.VietXfAdvStats_Thread'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['li[id^="post-"]'],
      handler: postHandler,
    },
  ],
  35,
);
