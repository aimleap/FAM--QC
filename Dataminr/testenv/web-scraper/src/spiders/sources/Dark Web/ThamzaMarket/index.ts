import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Thamza Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://thamzacnsl54lok65uqoh5ovznywydo6euqzsbft26jlidprvjsftwyd.onion/#pricing',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4[class*="f-20"]').text().trim();
    const text1 = $(el).find('div[class="mt-4 pt-2"]').text().replace(/^\s+|\s+$/gm, '')
      .trim();
    const text2 = $(el).find('p[class="mt-4 pt-2 text-muted"]').text().replace(/^\s+|\s+$/gm, '')
      .trim();
    const text3 = $(el).find('p[class="text-muted mb-0"]').text().replace(/^\s+|\s+$/gm, '')
      .trim();
    const articlefulltext = `${text1}\n${text2}\n${text3}`;
    let price = $(el).find('span[class="plan pl-3 text-dark"]').text().trim();
    if (price === '') {
      price = $(el).find('div[class="pricing-plan mt-4 pt-2"] s').text().trim();
    }
    const timestamp = moment().unix();
    posts.push(
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
            articlefulltext,
            price,
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
      name: 'post',
      selector: ['div[class="pricing-box mt-4"]'],
      handler: postHandler,
    },
  ],
  1440,
);
