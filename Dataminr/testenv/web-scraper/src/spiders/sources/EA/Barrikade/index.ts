import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News Website',
  isCloudFlare: false,
  name: 'Barrikade',
  type: SourceTypeEnum.FORUM,
  url: 'https://publish.barrikade.info/?page=articleCollection&var_mode=recalcul',
  requestOption: { method: 'GET' },
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);
  jsondata.data.forEach((item: any) => {
    const { date } = item;
    const description1 = item.chapo.replace(/<[^>]*>/g, '');
    const description2 = item.texte.replace(/<[^>]*>/g, '');
    const description3 = item.ps.replace(/<[^>]*>/g, '');
    const finaldescription = `${description1} ${description2} ${description3}`;
    const { id } = item;
    const { title } = item;
    const timestamp = moment.utc(date).unix();
    posts.push(
      new Post(
        `${title}\n${finaldescription}`,
        {
          current_url: `https://barrikade.info/article/${id}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext: finaldescription,
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  }, []);
  return posts;
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
