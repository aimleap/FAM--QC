import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Clop Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://toznnag5o3ambca56s2yacteu7q7x2avrfherzmz4nmujrjuib4iusad.onion/',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const Company = $(el).find('td:nth-child(1) a').text().trim();
    const Magnet = $(el)
      .find('td:nth-child(3) p:last-of-type')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${Company}\n${Magnet}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: Company,
            Company,
            Magnet,
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
      selector: ['table tbody tr'],
      handler: postHandler,
    },
  ],
  1440,
);
