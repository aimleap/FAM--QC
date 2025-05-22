import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'Medusa Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://xfv4jzckytb4g3ckwemcny3ihv4i5p4lqzdpi624cxisu35my5fwi5qd.onion/api/search?company=&page=0',
  expireIn: 200,
  injectHeaders: true,
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
  jsondata.list.forEach((item: any) => {
    const { id } = item;
    const link = `http://xfv4jzckytb4g3ckwemcny3ihv4i5p4lqzdpi624cxisu35my5fwi5qd.onion/detail?id=${id}`;
    const companyname = item.company_name;
    const date = item.updated_date;
    const { description } = item;
    const pricedownload = `$ ${item.price_download}`;
    const timestamp3 = moment.utc(date, 'YYYY-MM-DD hh:mm:ss').unix();
    posts.push(
      new Post(
        `${description}\n${companyname}`,
        {
          current_url: link,
        },
        timestamp3,
        [],
        [],
        new Map(
          Object.entries({
            entity: companyname,
            companyname,
            articlefulltext: description,
            price: pricedownload,
            postedate: date,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
