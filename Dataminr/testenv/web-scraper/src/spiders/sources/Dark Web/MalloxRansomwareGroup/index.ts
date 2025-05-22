import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Mallox ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://wtyafjyhwqrgo4a45wdvvwhen3cx4euie73qvlhkhvlrexljoyuklaad.onion/',
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
    const title = $(el).find('div[class="fs-3 fw-bold text-gray-900 mb-2"]').text().trim();
    const time = $(el).find('div[class="card-toolbar"] span').text().trim();
    const timestamp = moment.utc(time, 'DD/MM/YYYY hh:mm').unix();
    const articletext = $(el)
      .find('div[class*="text-gray-500 fw-semibold"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
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
      selector: ['div[class*="col-md-6 col-xl-4 mb-5"]'],
      handler: postHandler,
    },
  ],
  1440,
);
