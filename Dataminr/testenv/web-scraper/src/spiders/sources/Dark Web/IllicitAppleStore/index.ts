import moment from 'moment';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Illicit Apple Store',
  type: SourceTypeEnum.FORUM,
  url: 'http://ceyt3r2jnxzufrtaqcbizjqkjte6cvxlsgxa3k2oxlzd27q7fi2r7qad.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const articletext = $(el)
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r|\t)/gm, '');
    const spec = articletext.split('$')[0].split('   ');
    const link = `http://ceyt3r2jnxzufrtaqcbizjqkjte6cvxlsgxa3k2oxlzd27q7fi2r7qad.onion/${$(el)
      .find('font a')
      .attr('href')}`;
    const specification = spec[spec.length - 1];
    const title = spec[0];
    const price = `$${articletext.split('$')[1].trim()}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        title,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            articlefulltext: specification,
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
      selector: ['td[valign="top"] textbig2'],
      handler: postHandler,
    },
  ],
  1440,
);
