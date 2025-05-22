import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'TOR Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://xwhxvbvzctk6jtzzxerktddbnuofnfmmzav5fit2meuv7jknk5zpkwad.onion/',
};

async function categoryHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text().trim();
    const link = `http://xwhxvbvzctk6jtzzxerktddbnuofnfmmzav5fit2meuv7jknk5zpkwad.onion${$(
      el,
    ).attr('href')}`;
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
    const link = `http://xwhxvbvzctk6jtzzxerktddbnuofnfmmzav5fit2meuv7jknk5zpkwad.onion${$(
      el,
    )
      .find('a[class="vendors-list-item-title"]')
      .attr('href')}`;
    const title = $(el)
      .find('a[class="vendors-list-item-title"]')
      .text()
      .trim();
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
  const vendor = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="col-md-6 detail-text-vendor"] b')
    .text()
    .trim()
    .replace(/[\r\t\n\s]+/g, ' ');
  const entrySelector = $(elements)
    .find('div[class="catalog-section-list-item"]')
    .get();
  entrySelector.forEach((el: any) => {
    const title = $(el)
      .find('a[class="catalog-section-list-item-title"]')
      .text()
      .trim();
    const price = $(el)
      .find('div[class="col-md-9"] span').contents()
      .text()
      .trim();
    const link = `http://xwhxvbvzctk6jtzzxerktddbnuofnfmmzav5fit2meuv7jknk5zpkwad.onion${$(
      el,
    )
      .find('a[class*="title"]')
      .attr('href')}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}\n${price}`,
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
            vendor,
            articlefulltext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      name: 'category',
      selector: ['ul[class="nav nav-justified"] a[href*="catalog"]'],
      handler: categoryHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="vendors-list"] div[class="col-md-6 col-sm-4"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
