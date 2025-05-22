import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Bitcoin Quantum Miner',
  type: SourceTypeEnum.FORUM,
  url: 'http://btcqzgkgnku5trg46afd5famwibdt5lb4asypm2wjlsvmotcijd3iyqd.onion/',
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
    const title = $(el)
      .find('p:nth-child(1) strong')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const articlefulltext = `${$(el).find('p:nth-child(2)').text().trim()} ${$(
      el,
    )
      .find('p:nth-child(3)')
      .text()
      .trim()}`.replace(/[\t\n\s]+/g, ' ');
    const price = $(el)
      .find('p:nth-child(4) strong')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
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
            enity: title,
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
      selector: ['div[class="card-body text-center"] a[class*="product"]'],
      handler: postHandler,
    },
  ],
  1440,
);
