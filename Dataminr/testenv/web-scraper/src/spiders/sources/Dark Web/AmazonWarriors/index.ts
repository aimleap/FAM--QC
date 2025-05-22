import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Amazon Warriors',
  type: SourceTypeEnum.FORUM,
  url: 'http://5pih74lw63f4vykj7ki3pq445c5gbagzcdrwyatn5ezzhzmfbt5wqgqd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const articlefulltext = $(elements).find('table[width="1200"] tbody tr td:nth-child(2)').text().trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('h2[class="section-title"]').get();
  entrySelector.forEach((ele) => {
    const title1 = $(ele).text().trim();
    const entry = $(ele).find('+ div div[class="col-md-3 col-sm-6"]').get();
    entry.forEach((el) => {
      const title = `${title1}: ${$(el).find('h3').contents().text()
        .trim()}`;
      const timestamp = moment().unix();
      const price = $(el).find('p').text().trim();
      posts.push(
        new Post(
          title,
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
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
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
