import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Alpha Cards',
  type: SourceTypeEnum.FORUM,
  url: 'http://ap3pxwidty2zfhpnxkiubmkdr5oysbhxigpt64lqkb7wdmlzuxwdc2id.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://ap3pxwidty2zfhpnxkiubmkdr5oysbhxigpt64lqkb7wdmlzuxwdc2id.onion/${$(el).find('a').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title: '',
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
  const articlefulltext = $(elements).find('p[class="text1"]').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('p[class="h1"]+br+br+br+table table').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('p[class="h1"]').contents().text()
      .trim();
    const timestamp = moment().unix();
    const price = $(el).find('p[class="textprice"]').text().replace('Price: ', '')
      .trim();
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
      selector: ['td[valign="top"] table tbody tr:nth-of-type(2) td'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
