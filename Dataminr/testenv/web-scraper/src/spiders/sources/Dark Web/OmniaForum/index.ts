import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink, SourceType, SourceTypeEnum, ThreadType,
} from '../../../../lib/parserUtil';
import { getResponse } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: true,
  name: 'Omnia Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://szjjykwfhmsv5hlw2pculqz2jiujo4o2adyme3y5363lpqyg4fg5zfid.onion/',
  injectHeaders: true,
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('div[class="node-extra-row"] a[title]').attr('href');
    if (link1) {
      const title = $(el).find('h3[class="node-title"] a').text().trim();
      const link = `http://szjjykwfhmsv5hlw2pculqz2jiujo4o2adyme3y5363lpqyg4fg5zfid.onion${$(el).find('div[class="node-extra-row"] a[title]').attr('href')}`;
      const timestamp = Number($(el).find('time[class="node-extra-date u-dt"]').attr('data-time'));
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const title = $(elements).find('h1').text().trim();
  const forum = $(elements).find('ul[class="p-breadcrumbs "] li:nth-of-type(2) a span').text().trim();
  const entrySelector = $('article[class*="message   message"]:last').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('h4[class="message-name"] a span').text().trim();
    const articletext = $(el).find('div[class="bbWrapper"]').contents().text()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = Number($(el).find('time[itemprop="datePublished"]').attr('data-time'));
    const date = $(el).find('time[itemprop="datePublished"]').attr('title');
    const userlevel = $(el).find('div[class*="message-userTitle"]').text().trim();
    const userjoinedDate = $(el).find('div[class="message-userExtras"] dl:nth-of-type(1) dd').text().trim();

    posts.push(new Post(
      `${title}; ${forum} ${date}; ${articletext}`,
      {
        current_url: finalRedirectedUrl,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          forum,
          publisheddate: date,
          username,
          userlevel,
          userjoindate: userjoinedDate,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const isAuthenticated = ($: CheerioSelector) => $('form[action="/login/login"]').get().length === 2;

export const authenticate = async (username: string, password: string): Promise<object> => {
  Logger.info(`Attempt to login to ${source.name} with ${username}`);
  // @ts-ignore
  const initialResponse = await getResponse(
    {
      url: appendLink(source, ''),
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

  const response = await getResponse(
    {
      method: 'POST',
      url: appendLink(source, ''),
      // @ts-ignore
      formData: {
        login: username,
        password,
      },
      headers: {
        // @ts-ignore
        cookie: initialResponse.request.headers.cookie,
      },
    },
    source.isCloudFlare,
    source.name,
  );

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
      name: 'threads',
      selector: ['div[class="node-body"]'],
      handler: mainHandler,
    },
    {
      name: 'post',
      selector: ['div[class="p-body-wrap-container"]'],
      handler: postHandler,
    },
  ],
  35,
  isAuthenticated,
  authenticate,
);
