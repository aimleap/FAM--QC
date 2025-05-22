import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Allied Arms Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://ivc622np3wdwm4fi2axzgkbiheel7smrpqr47uo4jgicmux5ksqgrgyd.onion',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3[class="product-name"] a').text().trim();
    const link = $(el).find('h3[class="product-name"] a').attr('href');
    const timestamp = moment().unix();
    if (title) {
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
  const items: Post[] = [];
  let articlefulltext: string;
  const title = $(elements).find('h1[class="product_title entry-title"]').text().trim();
  const category = $(elements).find('span[class="posted_in"] a').text().trim();
  const price = $(elements).find('p[class="price"]').text().trim();
  const productDetails = $(elements).find('p[class="price"] + div[class="woocommerce-product-details__short-description"] ul li').contents().text()
    .trim();
  articlefulltext = $(elements).find('div[id="tab-description"] p').contents().text()
    .trim()
    .replace(/^\s+|\n+$/gm, '');
  if (articlefulltext === 'Discription') {
    articlefulltext = $(elements).find('div[id="tab-description"] li[class="nav-dropdown"]').contents().text()
      .trim()
      .replace(/^\s+|\n+$/gm, '');
  }
  const timestamp = moment().unix();
  items.push(
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
          category,
          price,
          productDetails,
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
      name: 'thread',
      selector: ['div[id="mtpl-1-tab-featured"] ul li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content col-xl-9 col-lg-8"]'],
      handler: postHandler,
    },
  ],
  1440,
);
