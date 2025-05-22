import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Dumps Market 3',
  type: SourceTypeEnum.FORUM,
  url: 'http://cardsm4cu45vmqyfcb6x4tgr6bob4t7a6jflywszifjmijqifkd7h4yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4:first').text().trim();
    const link = `http://cardsm4cu45vmqyfcb6x4tgr6bob4t7a6jflywszifjmijqifkd7h4yd.onion/${$(el).find('a:first').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  const producttype = $(elements).find('div[class="container"] p').text().replace(/[\t\n\s]+/g, ' ')
    .replace(':', '')
    .trim();
  const entrySelector = $(elements).find('div[class="col-md-4 team-grid"]').get();
  entrySelector.forEach((el) => {
    const title1 = $(el).find('div').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const entrySelector2 = $(el).find('tbody tr').get();
    entrySelector2.forEach((el1) => {
      const quantity = $(el1).find('td:nth-of-type(1)').text().trim();
      const price = $(el1).find('td:nth-of-type(2)').text().trim();
      const articlefulltext = `${producttype}\n${title1}\n${quantity}\n${price}`;
      const title = `${producttype} ${title1} ${quantity}`;
      const timestamp = moment().unix();
      items.push(
        new Post(
          `${articlefulltext}`,
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
              quantity,
              price,
              producttype,
              articlefulltext,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
  });
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="team-grids"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="team"]'],
      handler: postHandler,
    },
  ],
  1440,
);
