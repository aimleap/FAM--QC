import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Aftonbladet',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.aftonbladet.se/nyheter',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a h2').text().trim();
    const articletext = $(el).find('a p').text().trim();
    const timestamp = moment().unix();
    const text = `${articletext} ; ${title}`;
    if (articletext !== '') {
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
              title,
              Description: articletext,
              location: '',
              Date: '',
              entities: '',
              ingestpurpose: 'deepweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="article-extract"]'],
      handler: postHandler,
    },
  ],
  1440,
);
