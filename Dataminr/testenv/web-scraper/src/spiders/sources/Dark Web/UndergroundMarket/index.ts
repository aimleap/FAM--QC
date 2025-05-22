import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Underground Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://undeb6m465pjocdl6kvyiwefj5xxzcu3hgzngpfe5eolw764suu5v3id.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4:first').text().trim();
    const link = `http://undeb6m465pjocdl6kvyiwefj5xxzcu3hgzngpfe5eolw764suu5v3id.onion/${
      $(el).find('div[class="col-md-4 team-grid"] a:first').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
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
  const posts: Post[] = [];
  const maintitle = $(elements)
    .find('div[class="container"] p:first')
    .text()
    .trim();
  const entrySelector = $(elements)
    .find('div[class="col-md-4 team-grid"]')
    .get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div:first').text().trim();
    const entry = $(el).find('table[class="table1"] tbody tr').get();
    entry.forEach((ele) => {
      const quantity = $(ele).find('td:nth-of-type(1)').text().trim();
      const price = $(ele).find('td:nth-of-type(2)').text().trim();
      const title2 = `${maintitle} ${title} ${quantity}`;
      const finaltitle = title2.replace(/[\t\n\s]+/g, ' ');
      const timestamp = moment().unix();
      posts.push(
        new Post(
          finaltitle,
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: finaltitle,
              title: finaltitle,
              price,
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
      name: 'thread',
      selector: ['div[class="team-grids"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
