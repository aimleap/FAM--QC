import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Snatch Ransomware Group ',
  type: SourceTypeEnum.FORUM,
  url: 'http://hl66646wtlp2naoqnhattngigjp5palgqmbwixepcjyq5i534acgqyad.onion/',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'If-None-Match': 'W/3b97-0t8MN/21pxyI3sY5RNspFRHSYwQ',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="a-b-n-name"]').text();
    const link = `http://hl66646wtlp2naoqnhattngigjp5palgqmbwixepcjyq5i534acgqyad.onion/${$(el)
      .find('button[class="a-b-b-r-l-button"]')
      .attr('onclick')
      .split("window.location='")[1]
      .split("'")[0]
    }`;
    const time = $(el).find('div[class="a-b-h-time"]').text().trim();
    const timestamp = moment.utc(time, 'MMM D, YYYY hh:mm A').unix();
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
  const posts: Post[] = [];
  const articletext = $(elements).find('div[class="n-n-c-e-text"] p').text().trim();
  const title = $(elements).find('h2[class="n-n-c-e-n-name"]').text().trim();
  const createdAt = $(elements)
    .find('div[class="n-n-c-e-t-time"]')
    .text()
    .trim()
    .split('\n')[0]
    .trim()
    .replace('Created: ', '');
  const updatedAt = $(elements)
    .find('div[class="n-n-c-e-t-time"]')
    .text()
    .trim()
    .split('\n')[1]
    .trim()
    .replace('Updated: ', '');
  const timestamp = moment.utc(createdAt, 'MMM D, YYYY hh:mm A').unix();
  const text = `${articletext}\n${title}`;
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
          entity: title,
          title,
          articletext,
          createdAt,
          updatedAt,
          CompanyName: title,
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
      selector: ['div[class="ann-block"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
