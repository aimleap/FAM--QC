import moment from 'moment';
import cheerio from 'cheerio';
import AuthParser from '../../../parsers/AuthParser';
import {
  appendLink,
  getThreadArray,
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { getResponse } from '../../../../lib/crawler';
import Logger from '../../../../lib/logger';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: '0 Day Today',
  type: SourceTypeEnum.FORUM,
  url: 'https://en.0day.today/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
): Promise<ThreadType[]> {
  if (url !== source.url) return [];

  const response = await getResponse(
    {
      url: appendLink(source, `/date/${moment.utc().format('DD-MM-YYYY')}`),
      method: 'GET',
    },
    false,
    source.name,
  );

  if (response.statusCode !== 200) return [];

  const $$ = cheerio.load(response.body);
  const threads = $$('.ExploitTableContent').get();

  return getThreadArray($$, threads, 'h3 a', 'h3 a', (): number => moment().unix()).map((x) => ({
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
  const posts = $('.support_message').get();

  if (posts.length === 0) {
    return [
      new Post(
        $('.exploit_title').text().trim(),
        {
          author_name: $('.exploit_view_table_user_content a').text().trim(),
          author_url: appendLink(
            source,
            $('.exploit_view_table_user_content a').attr('href') || '',
          ),
          current_url: url,
        },
        moment.utc().unix(),
        forumPaths,
      ),
    ];
  }

  // @ts-ignore
  return posts
    .map((element) => {
      try {
        const $el = $(element);
        const message = $el.find('.support_text').text().trim();
        const profileLink = $el.find('.support_title a').attr('href') || '';
        const profileName = $el.find('.support_title a').text();
        const timestamp = $el.find('.support_date').text().trim();
        const postedAt = moment.utc(timestamp, 'DD-MM-YYYY, HH:mm').unix();
        return new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: url,
          },
          postedAt,
          forumPaths,
        );
      } catch (e) {
        Logger.warn('failed to parse post ', e);
        return null;
      }
    })
    .filter((x) => x !== null);
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'initializer',
      selector: ['body'],
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
