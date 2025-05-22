import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Fihris al-Ansar',
  type: SourceTypeEnum.FORUM,
  url: 'http://fahras4fw3s5bi3enjrompr6kxpywkscqmmcvyiyey3xamrv5zjllgad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const domain = $(el).find('a').attr('href');
    const title = $(el).contents().text().trim();
    const timestamp = moment().unix();
    const text = `${title}`;
    items.push(
      new Post(
        text,
        {
          current_url: `${source.url}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            enity: title,
            title,
            domain,
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
      selector: ['div[class="nv-content-wrap entry-content"] p'],
      handler: postHandler,
    },
  ],
  1440,
);
