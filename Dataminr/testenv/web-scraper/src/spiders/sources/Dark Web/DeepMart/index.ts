import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Deep Mart',
  type: SourceTypeEnum.FORUM,
  url: 'http://vpirzthkbzedr53dnk3d73cvybb5rzpfwf7xjsdlte7cntk6r6l6tnyd.onion/',
};

async function categoryHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a span').text().trim();
    const link = `http://vpirzthkbzedr53dnk3d73cvybb5rzpfwf7xjsdlte7cntk6r6l6tnyd.onion/${$(el).find('a').attr('href')}`;
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
    const title = $(el).find('h5 a').text().trim();
    const link = `http://vpirzthkbzedr53dnk3d73cvybb5rzpfwf7xjsdlte7cntk6r6l6tnyd.onion/${$(el).find('h5 a').attr('href')}`;
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
  const articlefulltext = $(elements).find('h3[class="seller-slogan"]').text().trim();
  const entrySelector = $(elements).find('div[class*="product-details"]').get();
  entrySelector.forEach((el) => {
    let price: string;
    const title = $(el).find('h4 a').text().trim();
    const link = `http://vpirzthkbzedr53dnk3d73cvybb5rzpfwf7xjsdlte7cntk6r6l6tnyd.onion/${$(el).find('h4 a').attr('href')}`;
    price = $(el).find('span[class="price-new"]').text().trim();
    if (price === '') {
      price = $(el).find('p[class="price"]').text().trim();
    }
    const timestamp = moment().unix();
    posts.push(
      new Post(
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
      name: 'category',
      selector: ['li[id*="main-menu-item"]'],
      handler: categoryHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="panel-body text-center"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
