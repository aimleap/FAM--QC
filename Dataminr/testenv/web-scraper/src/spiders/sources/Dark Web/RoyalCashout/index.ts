import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'Royal Cashout',
  type: SourceTypeEnum.FORUM,
  url: 'http://shopsd4txtunl6cyqevafd2akex5flam2zyy3do3lk6yu3dpqpydt7ad.onion/carding-cashout-shop/index.html',
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
    .find('div[class*="et_pb_column et_pb_column"]')
    .get();
  entrySelector.forEach((el) => {
    const title1 = $(el)
      .find('div:nth-of-type(2)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title2 = $(el)
      .find('div:nth-of-type(3)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title3 = $(el)
      .find('div:nth-of-type(4)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title4 = $(el)
      .find('div:nth-of-type(5)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title5 = $(el)
      .find('div:nth-of-type(6)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title6 = $(el)
      .find('div:nth-of-type(7)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title7 = $(el)
      .find('div:nth-of-type(8)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title8 = $(el)
      .find('div:nth-of-type(9)')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const title = `${title1} ${title2} ${title3}`;
    const articlefulltext = `${title4} ${title7} ${title8}`;
    const price = `${title5} ${title6}`;
    const timestamp = moment().unix();
    if (title1 !== '') {
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
      selector: ['div[class="entry-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
