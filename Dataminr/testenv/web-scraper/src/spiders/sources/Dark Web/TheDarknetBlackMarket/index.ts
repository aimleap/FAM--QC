import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'The Darknet Black Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://darkcctef2gtydfcgslrwj6vmu3ktse6pu5el7btczbfhsgiqtsrsoqd.onion/',

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
    const title = $(el).find('h3').text().trim() + $(el).find('h2').text().trim();
    const price = $(el).find('p').text().trim();
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
      selector: ['div[class="col-lg-3 col-md-4 col-sm-6 "]'],
      handler: postHandler,
    },
  ],
  1440,
);
