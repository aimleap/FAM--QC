import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'Ali Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://momofmysfga2aecmlrk2fx76wgcctjmcxejesgwlnpd3e5cabhow5cad.onion/',
};

async function mainHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
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

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4[class="product-title"] a').text().trim();
    const link = $(el).find('h4[class="product-title"] a').attr('href');
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
  const title = $(elements).find('h1[class="product_title entry-title"]').text().trim();
  const price = $(elements).find('p[class="price"]').text().trim();
  const category = $(elements).find('span[class="posted_in"] a').contents().text()
    .trim();
  const articletext = $(elements).find('div[id="tab-description"]').text().trim()
    .replace(/(\r\n|\n|\r)/gm, '');
  const timestamp = moment().unix();
  const tag = $(elements).find('span[class="tagged_as"] a').contents().text()
    .trim();
  posts.push(new Post(
    `${articletext}\n${title}\n${tag}`,
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
        price,
        category,
        tag,
        articletext,
        ingestpurpose: 'darkweb',
        parser_type: PARSER_TYPE.AIMLEAP_PARSER,
      }),
    ),
  ));
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['li[id="menu-item-1142"] ul li'],
      handler: mainHanlder,
    },
    {
      name: 'thread',
      selector: ['div[class="col-lg-3 col-md-6"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['body[data-target="#header"]'],
      handler: postHandler,
    },
  ],
  1440,
);
