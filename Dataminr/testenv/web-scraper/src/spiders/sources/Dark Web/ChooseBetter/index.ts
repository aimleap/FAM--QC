import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'Choose Better',
  type: SourceTypeEnum.FORUM,
  url: 'http://ujuwmruwekgs7ekzlpzrmvkgj7bmsykrcqbmhup3hinpm7lhl2howbqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const link = `http://ujuwmruwekgs7ekzlpzrmvkgj7bmsykrcqbmhup3hinpm7lhl2howbqd.onion/${$(el).find('a').attr('href')}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        title,
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
      selector: ['div[class*="col-lg-4 col-sm-6 col-md-6"]'],
      handler: postHandler,
    },
  ],
  1440,
);
