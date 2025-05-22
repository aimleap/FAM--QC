import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Nokoyawa Ransomware Group 3',
  type: SourceTypeEnum.FORUM,
  url: 'http://www.noko65rmtaiqyt2cw2h4jrxe3u56t2k7ov3nd22hoji4c5vnfib2i4yd.onion/api/leaks/get',
  requestOption: { method: 'GET' },
  expireIn: 200,
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url1: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);

  jsondata.payload.forEach((item: any) => {
    let { title } = item;
    title = decodeURIComponent(title);
    let { description } = item;
    description = description.replace(/<.*?>/g, '');
    description = decodeURIComponent(description);

    const { visits } = item;
    // eslint-disable-next-line no-underscore-dangle
    const id = item._id;
    let { url } = item;
    url = decodeURIComponent(url);
    const { createdAt } = item;
    const { updatedAt } = item;
    const timestamp = moment.utc(item.last_update).unix();
    posts.push(
      new Post(
        description,
        {
          current_url: `http://noko65rmtaiqyt2cw2h4jrxe3u56t2k7ov3nd22hoji4c5vnfib2i4yd.onion/api/leak/get${id}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext: description,
            visits,
            id,
            website: url,
            createdAt,
            updatedAt,
            ingestpurpose: 'darkweb',
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
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
