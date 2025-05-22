import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, ThreadType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Deep Paste',
  type: SourceTypeEnum.FORUM,
  url: 'http://depastedihrn3jtw.onion',
  entryUrl: '/last.php',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const now = moment().unix();
  const result: ThreadType[] = elements.map((element) => ({
    link: element.attribs.href,
    title: $(element).text(),
    timestamp: now,
    parserName: 'post',
  }));

  const page = $('a[href^="/last.php?page="]').get()[1].attribs.href;
  const pageNumber = page && page.match(/[0-9]+/);

  if (Array.isArray(pageNumber) && pageNumber.length > 0 && parseInt(pageNumber[0], 10) < 6) {
    result.push({
      link: $('a[href^="/last.php?page"]').get()[1].attribs.href || '',
      title: '',
      timestamp: now,
      parserName: 'thread',
    });
  }

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
      const message = $el.find('textarea').first().text().trim();
      const timestamp = $el.find('h3 + p').text();
      const firstIndex = timestamp.indexOf(',');
      const authorName = timestamp.substring(0, firstIndex);
      const postedAt = moment
        .utc(timestamp.replace(new RegExp(`${authorName}|UTC`), '').trim(), 'MMMM D, YYYY - h:mm a')
        .unix();
      posts.push(
        new Post(
          message,
          {
            author_name: authorName,
            author_url: url,
            current_url: url,
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
      selector: ['a[href^="show.php?"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  35,
);
