import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Medusa Locker Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad.onion/',
  randomDelay: [2, 10],
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const message = $el
      .find('div.entry-content p')
      .contents()
      .text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    const profileName = $el.find('header h2 a').text().trim();
    const link = $el.find('header h2 a').attr('href');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        message,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: profileName,
            ingestpurpose: 'mdsbackup',
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
      selector: ['main.site-main article'],
      handler: postHandler,
    },
  ],
  1440,
);
