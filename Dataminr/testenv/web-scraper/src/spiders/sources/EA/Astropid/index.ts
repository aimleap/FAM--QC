// @ts-ignore
import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType, ThreadType, SourceTypeEnum, getThreadArray,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { getResponse } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';
import { ErrorMessage } from '../../../../constants/errorMessage';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { toMd5 } from '../../../../lib/hashUtil';
import { lastSeenToUnixTimestamp } from '../../../../lib/timestampUtil';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Astropid',
  type: SourceTypeEnum.FORUM,
  url: 'https://astropid.net/',
  entryUrl: 'forums/forum.php',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads = getThreadArray(
    $,
    elements,
    'div.blockrow.vba_spacer a',
    'div.blockrow.vba_spacer a',
    (): number => moment().utc().unix(),
  ).map((t) => ({
    ...t,
    parserName: 'post',
  }));
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const username = $(el).find('div.popupmenu.memberaction strong').text().trim();
    const timestampString = $(el).find('span.date').text();
    if (timestampString.includes('Days') || timestampString.includes('Weeks')) return;
    const timestamp = lastSeenToUnixTimestamp(timestampString);
    if (!timestamp) return;
    const text = $(el)
      .find('div.content')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    posts.push(
      new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            username,
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const isAuthenticated = ($: CheerioSelector) => $('.welcomelink')
  .text()
  .search(/welcome/gi) !== -1;

export const authenticate = async (username: string, password: string): Promise<object> => {
  Logger.info(`Attempt to login to ${source.name} with ${username}`);
  const response = await getResponse(
    {
      method: 'POST',
      url: 'https://astropid.net/forums/login.php?do=login',
      // @ts-ignore
      form: {
        do: 'login',
        vb_login_md5password: toMd5(password),
        vb_login_md5password_utf: toMd5(password),
        s: '',
        securitytoken: 'guest',
        url: '/forums/forum.php',
        vb_login_username: username,
        vb_login_password: '',
      },
      headers: {
        authority: 'astropid.net',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US;q=0.5,en;q=0.3',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        cookie:
          'cf_chl_3=d659908201c83b5; cf_clearance=oTnXvu0o731Nn_LP249YFlA0VIOU4cb8kf_YINoxWxs-1707217575-1-AbE6jI4lV4+ELdwuqiPQhmfuaejVqnkBrMG6ZVOWuVVWV2DXJtLSS6uQ2C5bifBSrHcyzgaHcxBd2M9GBpRJ9lI=; bb_sessionhash=9725f80c20c743e4c794c703bd44bb33; bb_lastactivity=0; bb_lastvisit=1707217602; bb_lastactivity=0; bb_sessionhash=555ffec56236f32aa096ce400a0b4dbe',
        origin: 'https://astropid.net',
        referer: 'https://astropid.net/forums/login.php?do=login',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version-list': '"Not=A?Brand";v="99.0.0.0", "Chromium";v="118.0.5993.70"',
        'sec-ch-ua-model': '""',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      },
    },
    true,
    source.name,
  );
  if (response.body.indexOf('invalid username/password') !== -1) {
    Logger.warn(`invalid credential username: ${username}`);
    throw new Error(ErrorMessage.INVALID_CREDENTIAL);
  }
  const cookieArray = response.headers['set-cookie'];
  return {
    headers: {
      authority: 'astropid.net',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US;q=0.5,en;q=0.3',
      cookie: cookieArray?.join('; '),
      referer: 'https://astropid.net/forums/login.php?do=login',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-full-version-list': '"Not=A?Brand";v="99.0.0.0", "Chromium";v="118.0.5993.70"',
      'sec-ch-ua-model': '""',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    },
  };
};

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['#module5 div'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['li.postbitlegacy'],
      handler: postHandler,
    },
  ],
  1440,
  isAuthenticated,
  authenticate,
);
