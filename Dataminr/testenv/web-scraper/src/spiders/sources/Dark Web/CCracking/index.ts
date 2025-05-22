// @ts-ignore
import jMoment from 'moment-jalaali';
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
  isCloudFlare: true,
  name: 'C-Cracking',
  type: SourceTypeEnum.FORUM,
  url: 'https://c-cracking.org/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray($, elements, '.itemTitle', '.itemTitle', (): number => jMoment().unix()).map((x) => ({
    ...x,
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
      const message = $el.find('div[data-role=commentContent]').text().trim();
      const timestamp = $el.find('.ipsComment_meta time').attr('datetime');
      const postedAt = timestamp !== null ? jMoment(timestamp, 'jYYYY-jMM-jDDTHH:mm:ssZ').unix() : -1;
      const currentUrl = $el.find('a[data-role="shareComment"]').attr('href');
      const profileName = $el.find('.cAuthorPane_author a').text().trim();
      const profileUrl = $el.find('.cAuthorPane_author a').attr('href');
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: profileUrl,
            current_url: appendLink(source, currentUrl || url),
          },
          postedAt,
          [],
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
      selector: ['.proStats_content > div:last-child .ipsDataList .ipsDataItem'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['article[id^="elComment_"]'],
      handler: postHandler,
    },
  ],
  35,
);
