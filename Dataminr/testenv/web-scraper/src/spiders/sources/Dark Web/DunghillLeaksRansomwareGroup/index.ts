import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks',
  isCloudFlare: false,
  name: 'Dunghill Leaks Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd.onion/',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('div[class="ibody_title"]')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const domain = $(el)
      .find('div[class="ibody_body"] p:first-child a')
      .get()
      .map((ele) => $(ele).attr('href'))
      .join(', ');
    const articlefulltext = $(el)
      .find('div[class="ibody_body"] p:nth-child(3)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const date = $(el)
      .find('div[class="ibody_ft_left"] p:first-child')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ')
      .replace('Date:', '')
      .trim();
    const timestamp = moment.utc(date, 'DD.MM.YYYY').unix();
    const status = $(el)
      .find('div[class="ibody_ft_left"] p:nth-child(2)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ')
      .replace('Status:', '');
    const postUrl = `http://nsalewdnfclsowcal6kn5csm4ryqmfpijznxwictukhrgvz2vbmjjjyd.onion/${$(el)
      .find('div[class="ibody_ft_right"] a')
      .attr('href')}`;
    posts.push(
      new Post(
        `${title}; ${articlefulltext}`,
        {
          current_url: postUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            domain,
            articlefulltext,
            status,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['div[class="custom-container"] div[class="elem_ibody"]'],
      handler: postHandler,
    },
  ],
  1440,
);
