import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Anon Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://3el34jbxuwiigfzf4o75evttgilswlp7qdwcap6rfxi3eh27dzenaaqd.onion',
};

async function mainhandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).attr('href').split('/')[2];
    const link = `http://3el34jbxuwiigfzf4o75evttgilswlp7qdwcap6rfxi3eh27dzenaaqd.onion${$(el).attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="title"]').attr('title');
    const link = source.url + $(el).find('a:nth-child(2)').attr('href');
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
  const title = $(elements).find('div[class="heading"]:nth-child(1)').text().trim();
  const vendor = $(elements).find('div[class="information"] table tr:nth-child(1) u').text().trim();
  const location = $(elements).find('div[class="information"] table tr:nth-child(2) td:nth-child(3)').text().trim();
  const ships = $(elements).find('div[class="information"] table tr:nth-child(3) td:nth-child(3)').text().trim();
  const category = $(elements).find('div[class="information"] table tr:nth-child(4) td:nth-child(3)').text().trim();
  const stock = $(elements).find('div[class="information"] table tr:nth-child(5) td:nth-child(3)').text().trim();
  const deadDrop = $(elements).find('div[class="information"] table tr:nth-child(6) td:nth-child(3)').text().trim();
  const availability = $(elements).find('div[class="information"] table tr:nth-child(7) font').text().trim();
  const price = $(elements).find('div[class="information"] table tr:nth-child(8) b').text().trim();
  const articlefulltext = $(elements).find('div[class="tab1"]').contents().text()
    .trim();
  const timestamp = moment().unix();
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
          vendor,
          location,
          ships,
          category,
          stock,
          deadDrop,
          availability,
          price,
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
      name: 'main',
      selector: ['div[class="categories"] a[href*="category"]'],
      handler: mainhandler,
    },
    {
      name: 'thread',
      selector: ['div[class="main"] div[class="item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
