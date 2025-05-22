import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Astaricon Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://dw3ihrcs7ord7x6nxbsmjydttkauoc4i367gzzpr3csksuimf5hbjlid.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const articletext1 = $(elements)
    .find(
      'div[class="col-lg-7 col-md-7 col-sm-12 shop_info heading-space wow fadeInRight"] p',
    )
    .text()
    .trim()
    .split(':For')[0]
    .replace(/[\t\n\s]+/g, ' ');
  const extratext = $(elements)
    .find('ul[class="tabset-list"]')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const articletext = `${articletext1} ${extratext}`;
  const entrySelector = $(elements)
    .find(
      'div[class="col-lg-7 col-md-7 col-sm-12 shop_info heading-space wow fadeInRight"]',
    )
    .get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const price = $(el).find('h3[class="py-3"]').text().trim();
    const timestamp = moment().unix();
    items.push(
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
            articletext,
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
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
