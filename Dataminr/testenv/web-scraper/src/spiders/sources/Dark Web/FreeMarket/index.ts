import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'Free Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://fpdz4sbeldrqv5nxqctapcexo6nyarfopu42m7thzmht7zjcepi7a4qd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="headmenu_second"] a:nth-child(1)').text().trim();
    const link = `http://fpdz4sbeldrqv5nxqctapcexo6nyarfopu42m7thzmht7zjcepi7a4qd.onion${$(el).find('div[class="headmenu_second"] a:nth-child(1)').attr('href')}`;
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
    const link = $(el).find('div[class="title"] a').attr('href');
    const title = $(el).find('div[class="title"] a').text().trim();
    const timestamp = moment().unix();
    const storename = $(el).find('div[class="market over"] a').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const articlefulltext = $(el).find('div[class="text"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = $(el).find('span[class="price"]').contents().text()
      .trim();
    const location = $(el).find('li[class="over"]').attr('title');
    posts.push(
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
            entity: title,
            title,
            price,
            articlefulltext,
            storename,
            location,
            link,
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
      selector: ['nav[class="headmenu"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="catalog_item "]'],
      handler: postHandler,
    },
  ],
  1440,
);
