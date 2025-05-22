import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'BigBase Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://bigbase.su/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('li').get().slice(1, 4);
  entrySelector.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://bigbase.su${$(el).find('a').attr('href')}`;
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
  elements.forEach((el) => {
    let title = '';
    let subtype = '';
    let expiry = '';
    let credit = '';
    let country = '';
    let state = '';
    let bank = '';
    let price = '';
    let timestamp: number;
    if (url.includes('cvv')) {
      title = $(el).find('td:nth-child(2)').text().trim();
      subtype = $(el).find('td:nth-child(3)').text().trim();
      expiry = $(el).find('td:nth-child(4)').text().trim();
      country = $(el).find('td:nth-child(6)').text().trim();
      state = $(el).find('td:nth-child(7)').text().trim();
      bank = $(el).find('td:nth-child(8)').text().trim();
      price = $(el).find('td:nth-child(14)').text().trim();
      timestamp = moment().unix();
    } else {
      title = $(el).find('td:nth-child(4)').text().trim();
      subtype = $(el).find('td:nth-child(5)').text().trim();
      expiry = '';
      credit = $(el).find('td:nth-child(6)').text().trim();
      country = $(el).find('td:nth-child(7)').text().trim();
      state = '';
      bank = $(el).find('td:nth-child(8)').text().trim();
      price = $(el).find('td:nth-child(10)').text().trim();
      timestamp = moment().unix();
    }
    posts.push(
      new Post(
        `${title}\n${subtype}\n${expiry}\n${country}\n${bank}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: `${title}\n${bank}`,
            title,
            subtype,
            expiry,
            credit,
            country,
            state,
            bank,
            price,
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="col-12 col-sm-5 col-md-4 col-lg-3 col-xl-2"] div[class="menu"] ul'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['tbody tr'],
      handler: postHandler,
    },
  ],
  1440,
);
