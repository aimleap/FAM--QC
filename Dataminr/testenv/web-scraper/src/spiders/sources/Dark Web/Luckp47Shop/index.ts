import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Luckp 47 Shop',
  type: SourceTypeEnum.FORUM,
  url: 'http://luckp47htmgn3vm3wa3zw7hhowu6cb74grtbwiwxovjhnzkyui5qjpid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('td[class="figure"]').get();
  entrySelector.forEach((el) => {
    const content = $(el).find('p').text().trim();
    if (content.includes('Price')) {
      const titleprice = $(el).find('p').text().split('Price:');
      const title = titleprice[0].trim();
      const price = titleprice[1].trim();
      const timestamp = moment().unix();
      posts.push(new Post(
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
            title,
            price,
            articlefulltext: content,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ));
    }
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
