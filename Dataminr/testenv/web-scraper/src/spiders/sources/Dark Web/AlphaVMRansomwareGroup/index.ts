import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'AlphaVM Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://alphvuzxyxv6ylumd2ngp46xzq3pw6zflomrghvxeuks6kklberrbmyd.onion/api/blog/all/0/9',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://alphvuzxyxv6ylumd2ngp46xzq3pw6zflomrghvxeuks6kklberrbmyd.onion/?page=1',
      Connection: 'keep-alive',
      Cookie: '_dsi=1625879360299760163; _dsk=14753237599465425680',
      'Cache-Control': 'max-age=0',
    },
  },
  expireIn: 200,
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
  jsondata.items.forEach((item: any) => {
    let articlefulltext: string;
    const title = item.title.replace(/(\(.*?\))|(\[.*?\])/g, '');
    if (item.publication && item.publication.description) {
      articlefulltext = item.publication.description;
    } else {
      articlefulltext = '';
    }
    const domain = item.publication ? item.publication.url : '';
    const { id } = item;
    const timestamp = Math.floor(item.createdDt / 1000);
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
        {
          current_url: `http://alphvuzxyxv6ylumd2ngp46xzq3pw6zflomrghvxeuks6kklberrbmyd.onion/${id}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            domain,
            title,
            articlefulltext,
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
