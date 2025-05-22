import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: 'al-Quds Brigades',
  type: SourceTypeEnum.FORUM,
  url: 'https://saraya.ps/category/19/%D8%A7%D9%84%D9%85%D8%B2%D9%8A%D8%AF-%D9%85%D9%86-%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1/',
  requestOption: {
    authority: 'saraya.ps',
    method: 'GET',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua-Platform': 'Windows',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua':
      '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
  },
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: `page-${String(i)}`,
      link: encodeURI(`${source.url}page-${String(i)}`),
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3 a').text().trim();
    const link = encodeURI($(el).find('h3 a').attr('href'));
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const date = $(elements).find('span[class="text-xs"]').text().trim();
  const articlefulltext = $(elements)
    .find(
      'div[class="post-text text-base text-primary font-normal space-y-20"]',
    )
    .contents()
    .text()
    .trim();
  moment.locale('ar');
  const timestamp = adjustTimezone(
    moment.utc(date, 'dd DD MMMM YYYY').format('YYYY-MM-DD hh:mm A'),
    TIME_ZONE['Etc/GMT+5'],
  );
  items.push(
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
          articlefulltext,
          date,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: [
        'div[class="post post-2 group"],div[class="aspect-auto h-full"]',
      ],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="col-span-8"]'],
      handler: postHandler,
    },
  ],
  1440,
);
