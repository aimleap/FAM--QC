import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware Leaks Site',
  isCloudFlare: true,
  name: 'Underground ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://47glxkuxyayqrvugfumgsblrdagvrah7gttfscgzn56eyss5wg3uvmqd.onion',
  requestOption: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      Cookie: 'PHPSESSID=e7f12e26382813a734d78dfb532bae61',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    },
  },
};

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('div[class="block__info"]:nth-of-type(1) div:nth-of-type(1) p')
      .text()
      .trim();
    const link = `${source.url}${$(el)
      .find('a[class="stretched-link"]')
      .attr('href')}`;
    const time = $(el)
      .find('div[class="block__info"]:nth-of-type(2) div:nth-of-type(2) p')
      .text()
      .trim();
    const timestamp = moment.utc(time, 'MM/DD/YYYY hh:mm').unix();
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
  const title = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="filling"]')
    .contents()
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[class="left-col"] ').get();
  entrySelector.forEach((el) => {
    const revenue = $(el)
      .find(
        'div[class="left-col"] div[class="block__info"]:nth-of-type(1) div:nth-child(2)',
      )
      .text()
      .trim();
    const domain = $(el)
      .find('div[class="block__info"]:nth-of-type(1) div:nth-child(1)')
      .text()
      .trim();
    const industry = $(el)
      .find('div[class="block__info"]:nth-of-type(1) div:nth-child(3)')
      .text()
      .trim();
    const country = $(el)
      .find('div[class="block__info"]:nth-of-type(2) div:nth-child(1) p')
      .text()
      .trim();
    const datasize = $(el)
      .find('div[class="block__info"]:nth-of-type(2) div:nth-child(3) p')
      .text()
      .trim();
    const date = $(el)
      .find('div[class="block__info"]:nth-of-type(2) div:nth-child(2) p')
      .text()
      .trim();
    const timestamp = moment.utc(date, 'MM/DD/YYYY hh:mm').unix();
    items.push(
      new Post(
        ` ${title} ; ${articlefulltext}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            domain,
            revenue,
            industry,
            country,
            size: datasize,
            date,
            ingestpurpose: 'darkweb',
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
      selector: ['div[class="col-lg-6 col-12 mb-3"] '],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
