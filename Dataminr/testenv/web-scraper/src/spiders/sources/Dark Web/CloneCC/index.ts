import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Clone CC',
  type: SourceTypeEnum.FORUM,
  url: 'http://6flydlxzm4xbjkisghgs6doqcuj7hkuydybruugj3dtuyu2auqnrhiqd.onion/',
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
    const articlefulltext = $(el).find('li').text().slice(2)
      .trim();
    const price = $(el).find('div[class="amount"]').text().trim();
    const quantity = $(el).find('li[class="headline"] h5').text().trim();
    const title = quantity;
    const timestamp = moment().unix();
    const text = `${title}\n${articlefulltext}`;
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
            articlefulltext,
            quantity,
            price,
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
      selector: ['div[class="col-sm-4 pricing-container wow fadeInUp"]'],
      handler: postHandler,
    },
  ],
  1440,
);
