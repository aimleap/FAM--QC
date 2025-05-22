import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'B2B.Carding',
  type: SourceTypeEnum.FORUM,
  url: 'http://us6m5jj67yca7rs6ymuk4fv26ej5lbabm2sm6zaoosnyp2pchzzq6rqd.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://us6m5jj67yca7rs6ymuk4fv26ej5lbabm2sm6zaoosnyp2pchzzq6rqd.onion/${$(el).find('a').attr('href')}`;
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
    const title = $(el).find('h2 a').text().trim();
    const link = `http://us6m5jj67yca7rs6ymuk4fv26ej5lbabm2sm6zaoosnyp2pchzzq6rqd.onion/${$(el).find('h2 a').attr('href')}`;
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
  const articlefulltext = $(elements).find('div[id="productDescription"] p').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[id="content"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h1').text().trim();
    const timestamp = moment().unix();
    const price = $(el).find('strong[id="priceValue"]').text().trim();
    const text = `${title}`;
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
      name: 'main',
      selector: ['div[id="menu3"] ul:nth-child(2) li'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="list"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="body"]'],
      handler: postHandler,
    },
  ],
  1440,
);
