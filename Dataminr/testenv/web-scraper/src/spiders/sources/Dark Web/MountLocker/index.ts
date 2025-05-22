import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  getPaginationThreadArray,
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'mount locker',
  type: SourceTypeEnum.FORUM,
  url: 'http://mountnewsokhwilx.onion/',
};

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp, 'YYYY-MM-DDTHH:mm:ssSSZ').unix();

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getPaginationThreadArray(
    $,
    elements,
    'h3 a:first-child',
    ['h3 a'],
    ($html: CheerioSelector, element: CheerioElement): number => toUnixTimestamp($html(element).find('div.blog-one__meta a:first-child').text() || ''),
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
      const message = $el
        .find('div.blog-slider__text')
        .text()
        .match(/Client:\s*(.*?)\s*Website/);
      const dataExposed = $el
        .find('div.blog-slider__text')
        .text()
        .match(/Total data:\s*(.*?)\s*Phone/) || '';
      const rawTime = $el
        .find('div.blog-slider__text')
        .text()
        .match(/Lock date:\s*(.*?)\s*Total data/);
      if (!rawTime || !message) return;

      const timestamp = moment.utc(rawTime[0].trim(), 'YYYY-MM-DDTHH:mm:ssSSZ').unix();
      posts.push(
        new Post(
          message[1],
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map([['exposed_data_size', dataExposed[1]]]),
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
      selector: ['div.row div.blog-one__content'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div.blog-slider__content'],
      handler: postHandler,
    },
  ],
  25,
);
