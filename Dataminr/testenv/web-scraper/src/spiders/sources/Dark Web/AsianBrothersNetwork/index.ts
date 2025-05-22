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
  name: 'Asian Brothers Network',
  type: SourceTypeEnum.FORUM,
  url: 'http://cuixr7si6ydzxey5flvpgmwcnubtzc5g7zd27e65bqs3xuccmv4wa4id.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text().trim();
    const link = $(el).attr('href');
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
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el).attr('href');
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
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('p[class="price"]').text().trim()
    .split(' ').length > 2
    ? $(elements).find('p[class="price"]').text().trim()
    : $(elements).find('p[class="price"]').text().trim()
      .split(' ')[1];
  const text = `${title}\n${price}`;
  const articlefulltext = $(elements).find('div[id="tab-description"]').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const time = $(elements).find('div[class="post-date"]').text().trim();
  const timestamp = moment.utc(time, 'MMMM DD, YYYY').unix();
  items.push(
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
          price,
          articlefulltext,
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
      name: 'main',
      selector: ['ul[class="product-categories"] li a'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-4"] li a:nth-child(1)'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main-container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
