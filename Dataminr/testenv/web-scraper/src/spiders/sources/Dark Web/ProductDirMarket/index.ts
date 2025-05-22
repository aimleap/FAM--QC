import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'ProductDir Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://6o7yjljdqx3ag5br7kcq64a5hipzid3lrp5ucjrxkkaj3lqjnfinmuqd.onion/catalogue.php?cat=latest',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie: 'captcha=6023149',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="link-list"] div[class*="link-single "]').get();
  entrySelector.forEach((el) => {
    const title = $(el)
      .find('h4')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const category = $(el).find('p[class="category"] a').text().trim();
    const link = $(el).find('p[class="link"] a').attr('href');
    const description = $(el).find('p[class="description"]').text().trim();
    const price = $(el).find('div[class="price"]').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}\n${price}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            category,
            link,
            description,
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
      selector: ['div[class="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
