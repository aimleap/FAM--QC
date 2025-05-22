import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'CCPPSHOP',
  type: SourceTypeEnum.FORUM,
  url: 'http://t6ew32ovh6vzyqe2uzg2msvds46c7pxmlba5w46xh4bgc2rosebnmsad.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('section[class="section-90"] h2').get();
  entrySelector.forEach((el) => {
    const title1 = $(el).text().trim();
    const entry = $(el).find('+div div div[class*="box-planning box-planning-type-3"]').get();
    entry.forEach((ele) => {
      const title = `${title1}: ${$(ele).find('h3').contents().text()
        .trim()}${$(ele).find('p[class="h2 plan-price"]').text().trim()}`;
      const timestamp = moment().unix();
      const price = $(ele).find('p[class="h2 plan-price"]').text().trim();
      const listItems = $(ele).find('ul[class="list-separated list-unstyled"] li').get();
      const results: string[] = [];
      listItems.forEach((ele1) => {
        const symbolElement = $(ele1).find('span[class^="text-middle icon"]');
        let status;
        if (symbolElement.hasClass('mdi-check')) {
          status = 'yes';
        } else if (symbolElement.hasClass('mdi-close')) {
          status = 'no';
        } else {
          status = '';
        }
        const listItemText = $(ele1).text().trim();
        const formattedResult = `${listItemText}-${status}`;
        if (formattedResult.endsWith('-')) {
          results.push(formattedResult.slice(0, -1));
        } else {
          results.push(formattedResult);
        }
      });
      const articlefulltext = results.join(', ');
      posts.push(
        new Post(
          `${articlefulltext}\n${title}`,
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
