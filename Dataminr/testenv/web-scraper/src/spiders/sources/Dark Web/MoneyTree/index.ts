import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'MoneyTree',
  type: SourceTypeEnum.FORUM,
  url: 'http://tbdj72cpo7ynjelveygx6vwr7t4kmi46xl2gqbsjfqofz5r236luvcyd.onion/',

};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class*="elementor-column elementor-col-14 elementor-inner-column"]').get();
  entrySelector.forEach((el) => {
    const link1Element = $(el).find('a[role="button"]');
    if (link1Element.length > 0) {
      const link1 = link1Element.attr('href');
      if (link1 && link1.includes('product')) {
        const title = $(el).find('h4').text().trim();
        const price = $(el).find('span[class="elementor-button-text"]').text().replace('Buy for', '')
          .trim();
        const articlefulltext = $(el).find('div[class="elementor-widget-container"] p').text().replace(/[\t\n\s]+/g, ' ')
          .trim();
        const productimageurl = $(el).find('div[class="elementor-widget-container"] img').attr('src');
        const timestamp = moment().unix();
        posts.push(
          new Post(
            `${title}\n${price}`,
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
                productimageurl,
                ingestpurpose: 'darkweb',
                parser_type: PARSER_TYPE.AIMLEAP_PARSER,
              }),
            ),
          ),
        );
      }
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="elementor elementor-22"]'],
      handler: postHandler,
    },
  ],
  1440,
);
