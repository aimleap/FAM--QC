import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'GCKing Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://3srrej3hscywfrvdpsbwgmu5ttn4n47axuagbawueckheha6var3kkid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    const title = $(ele).find('h2').text().trim();
    const entrySelector = $(ele).find('div[class="button-group-area"] a').get();
    entrySelector.forEach((el: any) => {
      const price = $(el).text().trim();
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
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ));
    });
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="col-md-4 col-sm-12 single-feature pt-80 pb-80 d-flex flex-row"]'],
      handler: postHandler,
    },
  ],
  1440,
);
