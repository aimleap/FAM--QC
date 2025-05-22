import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'LostTrust Team',
  type: SourceTypeEnum.FORUM,
  url: 'http://hscr6cjzhgoybibuzn2xud7u4crehuoo4ykw3swut7m7irde74hdfzyd.onion/',
  expireIn: 200,
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
    const title = $(el).find('div[class="card-header"]').text().trim();
    const articletext = $(el)
      .find('div[class="card-body"] p:nth-child(1)')
      .contents()
      .text()
      .trim();
    const datasize = $(el).find('ul:nth-child(4) li:nth-child(1)').text().split(':')[1].trim();
    const timeleft = $(el).find('ul:nth-child(4) li:nth-child(2)').text().split(':')[1].trim();
    const postedtime = $(el).find('small[class="text-muted"]').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${articletext}\n${title}`,
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
            articletext,
            datasize,
            timeleft,
            postedtime,
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
      selector: ['div[class="col d-flex align-items-stretch mb-3"]'],
      handler: postHandler,
    },
  ],
  1440,
);
