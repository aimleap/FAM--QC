import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Dark Onion Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://g6ah7zsxot2jdbtjyu4vsjt4sxrsgfj6ivnxtmqadiqvywrjpezhiqqd.onion/',
};

async function mainHandler(
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
      timestamp,
      parserName: 'thread',
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector2 = $(elements).find('div[class*="col-md-3-4 "]').get();
  entrySelector2.forEach((el1) => {
    const title = $(el1).find('h3').text().trim();
    const link = $(el1).find('a').attr('href');
    const timestamp = moment().unix();

    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  elements.forEach((el) => {
    const title = $(el).find('h3 a').text().trim();
    const price = $(el).find('span[class="productPrice"]').text().trim();
    const articlefulltext = `${title}\n${price}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        articlefulltext,
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

  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['ul[id="CatNavi"] li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['section[class="col-lg-8-7"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class*="col-lg-3 col-md-4 "]'],
      handler: postHandler,
    },
  ],
  1440,
);
