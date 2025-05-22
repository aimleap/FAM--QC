import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Donex ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://g3h3klsev3eiofxhykmtenmdpi67wzmaixredk5pjuttbx7okcfkftqd.onion/',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Upgrade-Insecure-Requests': '1',
      'If-Modified-Since': 'Tue, 27 Feb 2024 02:00:47 GMT',
      'If-None-Match': 'W/65dd424f-1037',
      'Cache-Control': 'max-age=0',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="post-title"]').text().trim();
    const link = `http://g3h3klsev3eiofxhykmtenmdpi67wzmaixredk5pjuttbx7okcfkftqd.onion${$(el).find('a[class="post-title"]').attr('href')}`;
    const timestamp = moment($(el).find('div[class="post-date"]').text().trim(), 'YYYY.MM.DD').unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
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
  const title = $(elements).find('div[class="post-main-title"]').text().trim();
  const date = $(elements).find('div[class="post-meta"]').text().trim()
    .replace(' |', '');
  const articlefulltext = $(elements).find('div[class="post-md"] h4:first-child').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const domain = $(elements).find('div[class="post-md"] h4:nth-of-type(2) a').text().trim();
  const size = $(elements).find('div[class="post-md"] center:first-of-type h3').text().trim();
  const dataSize = size.includes(':') ? size.split(':')[1].trim() : '';
  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  posts.push(
    new Post(
      `${articlefulltext}\n${title}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          domain,
          dataSize,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="post-list"] div[class="post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
