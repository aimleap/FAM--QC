import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'The Armory',
  type: SourceTypeEnum.FORUM,
  url: 'http://ak47biwqhn2q7fonbxv4ndgfse5p54v3niadel5aqp2fez3ebmy2p6qd.onion/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Connection: 'keep-alive',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0',
    },
  },
};

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = `http://ak47biwqhn2q7fonbxv4ndgfse5p54v3niadel5aqp2fez3ebmy2p6qd.onion/${$(el).find('a').attr('href')}`;
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
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3 a').text().trim();
    const link = `http://ak47biwqhn2q7fonbxv4ndgfse5p54v3niadel5aqp2fez3ebmy2p6qd.onion/${$(el).find('h3 a').attr('href')}`;
    const price = $(el).find('p').text().trim();
    const timestamp = moment().unix();
    posts.push(new Post(
      `${title}`,
      {
        current_url: link,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          price,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="col-2 col-md-4 col-sm-6 col-xs-12"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['div[class="shop-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
