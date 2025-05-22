import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Voron Card',
  type: SourceTypeEnum.FORUM,
  url: 'http://rw6dbj2efldwrrak6xeuc7j33k74toa2mvhghkzzmkh7dxiu7ixcadad.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class="col-lg-4 col-md-6"]')
    .get();
  entrySelector.forEach((el) => {
    const title = $(el)
      .find('h5')
      .text()
      .trim()
      .replace('balance', ' balance')
      .replace('BALANCE', ' BALANCE');
    let price = $(el).find('h1').text().trim();
    if (price === '') {
      price = $(el).find('h5').text().trim()
        .split(' ')[2] || price;
    }
    let articletext = $(el)
      .find(' div[class="ff_classes_text"]')
      .contents()
      .text()
      .trim();
    if (articletext === '') {
      articletext = $(el)
        .find('div[class="ff_pricing_body"]')
        .contents()
        .text()
        .trim();
    }
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
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
            articletext,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
