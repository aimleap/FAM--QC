import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: '100 Bucks Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://etj5cepohz4pyyn32kya4beycmencgiks4caulnlaz4k6ivna3nmypqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('span').text().trim();
    const balance = $(el).find('p[class="desc"]').text().trim();
    const price = $(el).find('p[class="price"]').text().trim();
    const articletext = $(el)
      .find('p:nth-of-type(3)')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articletext}\n${price}\n${title}`,
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
            articlefulltext: articletext,
            price,
            balance,
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
      selector: ['div[class="col-md-2"]'],
      handler: postHandler,
    },
  ],
  1440,
);
