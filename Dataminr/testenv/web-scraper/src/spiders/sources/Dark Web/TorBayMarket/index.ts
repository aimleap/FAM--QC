import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'TorBay Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://torbay3253zck4ym5cbowwvrbfjjzruzthrx3np5y6owvifrnhy5ybid.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const indices = [0, 1, 2, 5];
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('a').get();
  entrySelector.forEach((el, index) => {
    if (indices.includes(index)) {
      const title = $(el).text().trim();
      const link = `http://torbay3253zck4ym5cbowwvrbfjjzruzthrx3np5y6owvifrnhy5ybid.onion${$(el).attr('href')}`;
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        parserName: 'pre',
        timestamp,
      });
    }
  });
  return items;
}

async function preHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4 a').text().trim();
    const link = `http://torbay3253zck4ym5cbowwvrbfjjzruzthrx3np5y6owvifrnhy5ybid.onion${$(el).find('a[class="btn btn-primary"]').attr('href')}`;
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
    const link = `http://torbay3253zck4ym5cbowwvrbfjjzruzthrx3np5y6owvifrnhy5ybid.onion${$(el).find('a[class="btn btn-primary"]').attr('href')}`;
    const title = $(el).find('p[class="name"] a').text().trim();
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
    const title = $(el).find('h1').text().trim();
    const price = $(el).find('div[class="price"]').text().trim();
    const description = $(el).find(' div[class="opt-group"]:nth-child(4)').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const maindescription = $(el).find('div[class="info"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const articlefulltext = description + maindescription;
    const timestamp = moment().unix();
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
            ingestpurpose: 'dakpweb',
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
      selector: ['div[class="subheader d-none d-sm-block"] ul[class="catalog-menu"]'],
      handler: mainHandler,
    },
    {
      name: 'pre',
      selector: ['div[class="vendor-card"]'],
      handler: preHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="product-card"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="container mt-3"]'],
      handler: postHandler,
    },
  ],
  1440,
);
