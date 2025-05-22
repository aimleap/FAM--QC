import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Ace Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://7pxhjhhfzk5gwtcprwjkvnyan6b4kvs673pmebzramnfsxpuqvgontqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://7pxhjhhfzk5gwtcprwjkvnyan6b4kvs673pmebzramnfsxpuqvgontqd.onion/${$(
      el,
    ).attr('href')}`;
    const timestamp = moment().unix();
    const title = $(el).find('button[type="button"]').text().split('|')[0].trim();
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
  const title = `Wallet: ${$(elements)
    .find('div[class="intro"] h2 span:nth-of-type(1)')
    .text()
    .trim()}`;
  const wallet = $(elements).find('div[class="intro"] h2 span:nth-of-type(1)').text().trim();
  const balance = $(elements)
    .find('div[class="intro"] h2 span:nth-of-type(2)')
    .text()
    .replace('Balance:', '')
    .trim();
  const privatekey = $(elements)
    .find('div[class="intro"] h2 span:nth-of-type(3)')
    .text()
    .replace('Private Key:', '')
    .trim();
  const price = $(elements)
    .find('button[id="start-mixing-btn"]')
    .text()
    .replace('Purchase for', '')
    .trim();
  const articlefulltext = $(elements).find('div[class="intro"]').text().trim();
  const domain = $(elements).find('section[class="widget links"] a').attr('href');
  const timestamp = moment().unix();
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
          wallet,
          balance,
          title,
          privatekey,
          price,
          articletext: articlefulltext,
          domain,
          ingestpurpose: 'darkweb',
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
      selector: ['div[id="content"] a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="page-wrapper"]'],
      handler: postHandler,
    },
  ],
  1440,
);
