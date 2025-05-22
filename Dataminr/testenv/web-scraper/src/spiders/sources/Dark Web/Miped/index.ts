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
  name: 'Miped',
  type: SourceTypeEnum.FORUM,
  url: 'https://miped.ru/f/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  // const initialResponse = await getResponse({
  //   url: source.url,
  //   method: 'GET',
  // });
  //
  // const $input = $('input[name=_xfToken]').get();
  //
  // if ($input.length === 0) return [];
  //
  // const token = $input[0].attribs.value;
  // const url = `lfs/tab/?tab_id=latest_posts&_xfRequestUri=/f/&_xfWithData=1&_xfToken=${token}&_xfResponseType=json`;
  //
  // const response = await getResponse({
  //   url: encodeURI(appendLink(source, url)),
  //   method: 'GET',
  //   // @ts-ignore
  //   headers: {
  //     cookie: initialResponse.headers['set-cookie'][0],
  //   },
  // });

  return getThreadArray(
    $,
    elements,
    '.itemTitle a',
    '.paint',
    ($html: CheerioSelector, element: CheerioElement): number => parseInt($html(element).find('.DateTime').attr('data-time') || '', 10),
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
      $el.find('blockquote .bbCodeBlock').remove();
      const message = $el.find('blockquote').text().trim();
      const profileLink = $el.find('.userText a').attr('href') || '';
      const profileName = $el.find('.userText a').text();
      const timestamp = parseInt($el.find('.messageDetails .DateTime').attr('data-time') || '', 10);
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.messageDetails .postNumber').attr('href') || url,
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
      name: 'threads',
      selector: ['body'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['li[id^="post-"]'],
      handler: postHandler,
    },
  ],
  25,
);
