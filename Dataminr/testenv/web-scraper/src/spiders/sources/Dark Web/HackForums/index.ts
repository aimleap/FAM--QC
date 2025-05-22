import moment from 'moment';
// @ts-ignore
import cookie from 'cookie';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink,
  SourceType,
  ThreadType,
  SourceTypeEnum,
  getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { getResponse } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';

import { ErrorMessage } from '../../../../constants/errorMessage';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: true,
  name: 'Hack Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://hackforums.net',
};

function getUnixTimestamp(timestamp: string): number {
  return moment.utc(timestamp.trim(), 'MM-DD-YYYY, hh:mm A').add(7, 'hour').unix();
}

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    'td strong a',
    'td strong a',
    ($html: CheerioSelector, element: CheerioElement): number => getUnixTimestamp($html(element).find('.tright span[title]').attr('title') || ''),
  ).map((t) => ({
    ...t,
    parserName: 'thread',
  }));
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getThreadArray(
    $,
    elements,
    '.subject_new a',
    '.subject_new a',
    ($html: CheerioSelector, element: CheerioElement): number => getUnixTimestamp($html(element).find('.lastpost span[title]').attr('title') || ''),
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
      $el.find('.post_edit').remove();
      const message = $el.find('.post_body').text().trim();
      const profileLink = $el.find('.author_information .largetext a').attr('href') || '';
      const profileName = $el.find('.author_information .largetext a').text();
      const timestamp = $el.find('.post_date span[title]').attr('title') || '';
      const postedAt = getUnixTimestamp(timestamp.trim());
      posts.push(
        new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(source, $el.find('a[id^="post_url"]').attr('href') || url),
          },
          postedAt !== undefined ? postedAt : 0,
          forumPaths,
        ),
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const isAuthenticated = ($: CheerioSelector) => $('.welcome')
  .text()
  .search(/welcome back/gi) !== -1;

export const authenticate = async (username: string, password: string): Promise<object> => {
  Logger.info(`Attempt to login to ${source.name} with ${username}`);

  // @ts-ignore
  const initialResponse = await getResponse(
    {
      url: appendLink(source, '/index.php'),
      method: 'GET',
    },
    source.isCloudFlare,
    source.name,
  );

  // @ts-ignore
  const { body, headers } = initialResponse;

  if (body === undefined || headers === undefined) {
    Logger.warn(`failed to get initial login for ${source.url}`);
    return {};
  }

  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  const cfId = cookie.parse(initialResponse.request.headers.cookie).__cfduid;
  const response = await getResponse(
    {
      method: 'POST',
      url: appendLink(source, '/member.php'),
      // @ts-ignore
      formData: {
        action: 'do_login',
        password,
        quick_gauth_code: '',
        remember: 'yes',
        submit: 'Login',
        url: '',
        username,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // @ts-ignore
        cookie: `__cfduid=${cfId};`,
      },
    },
    source.isCloudFlare,
    source.name,
  );

  if (response.body.indexOf('invalid username/password') !== -1) {
    Logger.warn(`invalid credential username: ${username}`);
    throw new Error(ErrorMessage.INVALID_CREDENTIAL);
  }

  return {
    headers: {
      Cookie: response.request.headers.cookie,
    },
  };
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main-thread',
      selector: ['div[id^="tabmenu"] table tbody tr'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['table .inline_row'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['.post.classic'],
      handler: postHandler,
    },
  ],
  35,
  isAuthenticated,
  authenticate,
);
