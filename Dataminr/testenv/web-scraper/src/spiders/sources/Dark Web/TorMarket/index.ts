import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'TorMarket',
  type: SourceTypeEnum.FORUM,
  url: 'http://dtp4cbz4rkrorhdqfk5xkad5ugj2jifap2veyrz2q6zgkeasbz4p52yd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('section[class*="elementor-section elementor-inner-section"] div[class*="elementor-column elementor-col-33"] ').get().slice(3);
  entrySelector.forEach((el) => {
    const title = $(el).find('span[class="ryNqvb"]').contents().text()
      .trim();
    const price = $(el).find('span[class="elementor-button-text"]').text().trim()
      .replace('BUY FOR ', '');
    const timestamp = moment().unix();
    posts.push(new Post(
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
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
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
