import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Rnsomeware Leaks',
  isCloudFlare: false,
  name: 'Space Bears ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://5butbkrljkaorg5maepuca25oma7eiwo6a2rlhvkblb4v6mf3ki2ovid.onion//',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class="companies-list__item"]')
    .get();
  entrySelector.forEach((el) => {
    const title = $(el)
      .find(' div[class="name"] a')
      .text()
      .trim()
      .replace('balance', ' balance')
      .replace('BALANCE', ' BALANCE');
    const link = $(el).find('div[class="name"] a').attr('href');
    const domain = $(el).find('div[class="text"] a').text().trim();
    const articletext = $(el)
      .find('div[class="text"] ')
      .contents()
      .text()
      .trim()
      .replace(domain, '');
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${title} ; ${articletext}`,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            description: articletext,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
