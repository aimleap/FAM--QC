import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'LordPay Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://haupq6fgf2vwndqznybz6gb7ioeopjrrxxznymmblahqpnwhknpqteqd.onion/',
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
    const articlefulltext = $(el)
      .find('div[class="box"]>p')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const title = $(el).find('div[class="box"]>h4').text().trim()
      .split('-')[0];
    const price = $(el).find('div[class="box"]>h4').text().trim()
      .split('-')[1];
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
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['section[class="4u"]'],
      handler: postHandler,
    },
  ],
  1440,
);
