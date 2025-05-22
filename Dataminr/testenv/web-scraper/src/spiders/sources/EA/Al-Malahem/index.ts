import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News Website',
  isCloudFlare: false,
  name: 'Al-Malahem',
  type: SourceTypeEnum.FORUM,
  url: 'https://malaahem.net/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      Cookie: 'wp_mid=9538ddf5d30f657fc1b9d71c; _wsm_ses_1_7f3c=*; _wsm_id_1_7f3c=53e1af013652f90d.1688964480.8.1689011958.1689000928',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];

  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el).find('h2 a').attr('href');
    const date = $(el).find(' time[class="post-date"]').attr('datetime');
    const timestamp = moment(date).unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
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
  const title = $(elements).find('h1[class="is-title post-title"]').text().trim();
  const date = $(elements).find('span[class="meta-item date"] time[class="post-date"]').text().trim();
  const time = $(elements).find('span[class="meta-item date"] time[class="post-date"]').attr('datetime');
  const articlefulltext = $(elements).find('div[class="post-content cf entry-content content-spacious-full"] p').contents().text()
    .trim();
  const timestamp = moment(time).unix();
  items.push(
    new Post(
      `${title}`,
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
      name: 'thread',
      selector: ['article[class="l-post grid-post grid-sm-post"], article[class="l-post grid-overlay overlay-post grid-overlay-a overlay-base-post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main ts-contain cf no-sidebar"]'],
      handler: postHandler,
    },
  ],
  1440,
);
