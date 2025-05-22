import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'Red Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://33zo6hifw4usofzdnz74fm2zmhd3zsknog5jboqdgblcbwrmpcqzzbid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements).find('div[class="p-2 w-25"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h4').text().trim();
    const text = $(el).find('div[class="card-body"] p').text().trim();
    const date = $(el).find('div[class="card-footer text-muted text-center"]').text().trim();
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
    items.push(
      new Post(
        `${title};${text}`,
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
            text,
            date,
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
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
