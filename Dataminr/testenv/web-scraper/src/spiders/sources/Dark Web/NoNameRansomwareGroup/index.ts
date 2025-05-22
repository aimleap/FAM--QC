import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'NoName Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://noname2j6zkgnt7ftxsjju5tfd3s45s4i3egq5bqtl72kgum4ldc6qyd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('article[class="uagb-post__inner-wrap"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h4 a').text().trim();
    if (!title.includes('NEGOTIATED')) {
      const link = $(el).find('h4 a').attr('href');
      const articlefulltext = $(el)
        .find('div.uagb-post__text.uagb-post__excerpt')
        .text()
        .trim()
        .replace(/\s+/g, ' ');
      const timestamp = moment().unix();
      posts.push(
        new Post(
          `${title}; ${articlefulltext}`,
          {
            current_url: link,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: title,
              description: articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
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
