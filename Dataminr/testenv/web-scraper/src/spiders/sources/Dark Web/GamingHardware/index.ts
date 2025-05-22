import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'Gaming Hardware',
  type: SourceTypeEnum.FORUM,
  url: 'http://nvidialkagnt37uon4hnwkz7xruhlpipeaz6j6zlugqf4mlpdfp6hgqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title1 = $(elements)
    .find('div[class="caption"] p:first')
    .clone()
    .find('b')
    .remove()
    .end()
    .text()
    .replace(/[\t\n\s]+/g, ' ')
    .trim();
  const title2 = $(elements)
    .find('div[class="caption"] p:first b')
    .text()
    .replace(/[\t\n\s]+/g, ' ')
    .trim();
  const title = `${title1} ${title2}`;
  const price = $(elements)
    .find('div[class="caption"] p:nth-of-type(2) b')
    .text()
    .replace(/[\t\n\s]+/g, ' ')
    .trim();
  const articlefulltext = `${title}\n${price}`;
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${articlefulltext}`,
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

  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="container2"]:first'],
      handler: postHandler,
    },
  ],
  1440,
);
