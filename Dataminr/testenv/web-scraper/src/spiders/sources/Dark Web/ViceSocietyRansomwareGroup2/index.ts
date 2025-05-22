import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Vice Society Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://ssq4zimieeanazkzc5ld4v5hdibi2nzwzdibfh5n5w4pw5mcik76lzyd.onion/partners.html',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('font[size="4"] b').text().trim();
    const domain = $(el).find('a font[size="2"] b').contents().text()
      .trim();
    const articletext = $(el).find('font:nth-of-type(3) b').text().trim();
    const country = $(el).find('font[size="2"]:nth-of-type(2)').text().trim();
    const timestamp = moment().unix();
    const text = `${articletext}\n${title}`;
    items.push(
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
            enity: title,
            title,
            articletext,
            domain,
            country,
            CompanyName: title,
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
      selector: ['td[valign="top"]'],
      handler: postHandler,
    },
  ],
  1440,
);
