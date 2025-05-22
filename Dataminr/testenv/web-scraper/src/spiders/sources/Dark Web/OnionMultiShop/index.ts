import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Onion MultiShop',
  type: SourceTypeEnum.FORUM,
  url: 'http://fugaijr6sx4eo3siplh44qkp5foav6eu3vv2bzztxanzu3ko74wcx3ad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('p strong').text().trim();
    const price = $(el).find('p[class="price"]').text().trim();
    const articlefulltext = $(el).find('span').text().trim();
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
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
            enity: title,
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
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="col-12 col-lg-4"]'],
      handler: postHandler,
    },
  ],
  1440,
);
