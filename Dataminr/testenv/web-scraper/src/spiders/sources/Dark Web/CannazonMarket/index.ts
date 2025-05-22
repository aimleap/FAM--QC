import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Cannazon Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://n7arfmj2ycewhreuctme5yrm2qjxrcguwhtvbgyv3qsgsjckafl6wjyd.onion/d22kxrz7vfawxzkpivvcicqslvc4k4urmk2xcrzzl5hmoabeopv54fad',
  requestOption: {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      Connection: 'keep-alive',
      'Content-Type': 'application/json; charset=UTF-8',
      Origin: 'http://n7arfmj2ycewhreuctme5yrm2qjxrcguwhtvbgyv3qsgsjckafl6wjyd.onion',
      Referer: 'http://n7arfmj2ycewhreuctme5yrm2qjxrcguwhtvbgyv3qsgsjckafl6wjyd.onion/?sayfa=ilanlar',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      msj: 'ilanlari_getir',
      ilan_kategori: 'market',
      page_no: 1,
    }),
  },
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
  jsondata.sonuclar.forEach((item: any) => {
    const title = item.ilan_ad;
    const price = item.ilan_fiyat_usd;
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
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
