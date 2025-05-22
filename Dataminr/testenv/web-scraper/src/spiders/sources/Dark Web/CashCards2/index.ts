import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'Cash card 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://wth474sv6ct4glwiowjipvr6ydeg6tbxlenxqibe5vno7ivmeqlumnid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class="elementor-price-table"]')
    .get();
  entrySelector.forEach((el) => {
    const title1 = $(el)
      .find('div[class="elementor-price-table__header"]')
      .text()
      .trim();
    if (title1) {
      const title = $(el)
        .find('div[class="elementor-price-table__header"]')
        .text()
        .replace(/[\t\n\s]+/g, ' ')
        .trim();
      const price = $(el)
        .find('div[class="elementor-price-table__price"]')
        .text()
        .replace(/[\t\n\s]+/g, ' ')
        .trim();
      const articlefulltext = $(el)
        .find('ul[class="elementor-price-table__features-list"]')
        .contents()
        .text()
        .replace(/[\t\n\s]+/g, ' ')
        .trim();
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${title}`,
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
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
