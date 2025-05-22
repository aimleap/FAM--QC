import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'E-Cash Market 3',
  type: SourceTypeEnum.FORUM,
  url: 'http://ecash6xc4uc6z4lkmywkb2srwgqdey7mwzxdvzw5gdmcxp5u7zv3c6yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('h2 a').attr('href');
    if (link1) {
      const link = `http://ecash6xc4uc6z4lkmywkb2srwgqdey7mwzxdvzw5gdmcxp5u7zv3c6yd.onion${$(el).find('h2 a').attr('href')}`;
      const title = $(el).find('h2 a').text().trim();
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
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
    const title = $(el).find('h1').text().trim();
    const price = $(el).find('span[class="PricesalesPrice"]').text().trim();
    const articlefulltext = $(el).find('div[class="product-description"] p').text().split('Please read the buyer guide')[0].replace('Description', '').replace(/[\t\n\s]+/g, ' ').trim();
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
            price,
            articlefulltext,
            ingestpurpose: 'darkweb',
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
      selector: ['div[class="spacer product-container"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
