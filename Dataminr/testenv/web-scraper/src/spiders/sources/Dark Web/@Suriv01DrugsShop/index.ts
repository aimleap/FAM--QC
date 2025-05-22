import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Marketplace',
  isCloudFlare: false,
  name: '@Suriv01 Drugs Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://hyf37my27mgaqzc7suszc3nstlmss2xf76vjsl2zygpu7v5qxjigbqqd.onion/products.html',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const articletext = $(el).find('ul').contents().text()
      .trim();
    const timestamp = moment().unix();
    const text = `${articletext}\n${title}`;
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
            enity: title,
            title,
            articletext,
            CompanyName: title,
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
      selector: ['div[class="card"]'],
      handler: postHandler,
    },
  ],
  1440,
);
