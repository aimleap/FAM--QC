import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Crypto24 ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion/',
  entryUrl: 'api/data',
  randomDelay: [10, 20],
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion/',
      Connection: 'keep-alive',
      'If-None-Match': 'W/803-2PRaHULmN3c6dIo80jS7BbzaHrc',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
): Promise<Post[]> {
  const posts: Post[] = [];
  const jsondata = JSON.parse($('body').text());
  jsondata.forEach((item: any) => {
    const companydomain = item.domain;
    const companyname = item.company;
    const timestamp = moment().unix();
    posts.push(new Post(
      `${companyname}; ${companydomain}`,
      {
        current_url: source.url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: companyname,
          domain: companydomain,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
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
