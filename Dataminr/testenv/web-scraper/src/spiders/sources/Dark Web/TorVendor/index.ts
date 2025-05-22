import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'TorVendor',
  type: SourceTypeEnum.FORUM,
  url: 'http://jw3tsbjeqkznlslnlo56fxvfngqq7abgs462du7rmq2xhf54debibxqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('a').get().slice(0, 2);
  entrySelector.forEach((el) => {
    const link = `http://jw3tsbjeqkznlslnlo56fxvfngqq7abgs462du7rmq2xhf54debibxqd.onion${$(el).attr('href')}`;
    const title = $(el).text().trim();
    const timestamp = moment().unix();
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
  const accounttype = $(elements).find('h1').clone().find('span[class*="small"]')
    .remove()
    .end()
    .text()
    .trim();
  const entrySelector = $(elements).find('tbody tr').get();
  entrySelector.forEach((el) => {
    if (url.includes('paypal')) {
      const ID = $(el).find('td:nth-child(1)').text().trim();
      const accountbalance = $(el).find('td:nth-child(2)').text().trim();
      const accountprice = $(el).find('td:nth-child(3)').text().trim();
      const yourprofit = $(el).find('td:nth-child(4)').text().trim();
      const accountlocation = $(el).find('td:nth-child(5)').text().trim();
      const buynow = $(el).find('td:nth-child(6)').text().trim();
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${ID}\n${accounttype}`,
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: ID,
              ID,
              accountbalance,
              accountprice,
              yourprofit,
              accountlocation,
              buynow,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    } else if (url.includes('bank')) {
      const ID = $(el).find('td:nth-child(1)').text().trim();
      const accountbalance = $(el).find('td:nth-child(2)').text().trim();
      const accountprice = $(el).find('td:nth-child(3)').text().trim();
      const yourprofit = $(el).find('td:nth-child(4)').text().trim();
      const accountlocation = $(el).find('td:nth-child(5)').text().trim();
      const buynow = $(el).find('td:nth-child(7)').text().trim();
      const bankname = $(el).find('td:nth-child(6)').text().trim();
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${ID}\n${accounttype}`,
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: ID,
              ID,
              accountbalance,
              accountprice,
              yourprofit,
              accountlocation,
              bankname,
              buynow,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['ul[class="nav navbar-nav navbar-right"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body div[class="container"]:nth-of-type(4)'],
      handler: postHandler,
    },
  ],
  1440,
);
