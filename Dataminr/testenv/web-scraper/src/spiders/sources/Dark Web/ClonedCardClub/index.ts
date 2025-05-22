import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'Cloned Card Club',
  type: SourceTypeEnum.FORUM,
  url: 'http://cccclubzg7s7nveyeagf5nzkw5bo5vjn2dfkpfanuhxelysljx6brnyd.onion/',
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
    const articlefulltext = $(el).find('div[class="inner"] h5').text().trim();
    const price = $(el)
      .find('div[class="inner"] h4')
      .text()
      .trim()
      .split(' ')[1];
    const title = $(el).find('div[class="inner"] h3').text().trim();
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
      selector: ['div[class="box"]'],
      handler: postHandler,
    },
  ],
  1440,
);
