import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Digital Den',
  type: SourceTypeEnum.FORUM,
  url: 'http://igv5qoskzw4dc6pcqibqakfdvrjwlkrowbj23tsriz4xlohctqhgtpqd.onion/',
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
    const title = $(ele).find('h3').text().trim();
    const price = $(ele).find('p[class="price"]').text().trim();
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
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['section[id="products"] div[class="col-12 col-lg-4"]'],
      handler: postHandler,
    },
  ],
  1440,
);
