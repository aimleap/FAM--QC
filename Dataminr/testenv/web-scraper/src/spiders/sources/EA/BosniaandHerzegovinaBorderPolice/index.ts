import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Govt. Website',
  isCloudFlare: false,
  name: 'Bosnia and Herzegovina Border Police',
  type: SourceTypeEnum.FORUM,
  url: 'https://granpol.gov.ba/Publication/Category/1?page=1&pageId=23',
  requestOption: {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie: 'ASP.NET_SessionId=hutgsor2hqk3ko0oxhnn4xjg; _ga=GA1.3.1980490485.1721440153; _gid=GA1.3.2104249537.1721440153; _gat=1; _ga_YRE3N7V0HX=GS1.3.1721440153.1.0.1721440153.0.0.0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
    rejectUnauthorized: false,
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('a').attr('href');
    if (link1) {
      const title = $(el).find('a').text().split('\n')[0].trim();
      const link = `https://granpol.gov.ba${$(el).find('a').attr('href')}`;
      const date = $(el).find('p[class="date"]').text().trim();
      const timestamp = moment.utc(date, 'DD-MM-YYYY.').unix();
      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1').text().trim();
    const articlefulltext = $(el).find('article[class="body"] p').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            text: articlefulltext,
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['article[class="body"] ul[class="list-unstyled list-docs"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="box main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
