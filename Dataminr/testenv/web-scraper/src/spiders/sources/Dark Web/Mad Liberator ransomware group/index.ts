import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomeware',
  isCloudFlare: false,
  name: 'Mad Liberator ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://k67ivvik3dikqi4gy4ua7xa6idijl4si7k5ad5lotbaeirfcsx4sgbid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const articletext = $(el)
      .find('div[class="blog-list--desc p-3 cnt"] p')
      .text()
      .trim();
    const timestamp = moment().unix();
    const text = `${title} ; ${articletext} `;
    items.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            entity: title,
            articletext,
            domain: title,
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
      selector: ['div[class="col-md-6"]'],
      handler: postHandler,
    },
  ],
  1440,
);
