import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'Apple World Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://appworld55fqxlhcb5vpdzdaf5yrqb2bu2xtocxh2hiznwosul2gbxqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2 a').text().trim();
    const link = `http://appworld55fqxlhcb5vpdzdaf5yrqb2bu2xtocxh2hiznwosul2gbxqd.onion/${$(el)
      .find('h2 a')
      .attr('href')}`;
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
  const title = $(elements).find('h1').text().trim();
  const price = `${$(elements).find('div[id="price"] strong').text().trim()} ${$(elements)
    .find('div[id="price"] span')
    .text()
    .trim()}`;
  const articlefulltext = $(elements)
    .find('div[id="productDescription"] p')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  const text = `${title}\n${price}`;
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
      selector: ['div[id="products"] ul[class="list"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="product"]'],
      handler: postHandler,
    },
  ],
  1440,
);
