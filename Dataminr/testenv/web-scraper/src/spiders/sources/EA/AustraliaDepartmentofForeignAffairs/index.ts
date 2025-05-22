import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Government / Official',
  isCloudFlare: true,
  name: 'Australia Department of Foreign Affairs',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.dfat.gov.au/international-relations/security/sanctions?page=1',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `https://www.dfat.gov.au/news${$(el)
      .find('h3[class="teaser__title"] a')
      .attr('href')}`;
    const title = $(el).find('h3[class="teaser__title"] a').text().trim();
    const date = $(el).find('time').attr('datetime');
    const timestamp = moment(date).unix();
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
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1[class="au-header-heading"]').text().trim();
  const subtitle = $(elements)
    .find('div[class*="field--name-field-body"] p:nth-of-type(1)')
    .text()
    .trim();
  const articlefulltext = $(elements)
    .find('div[class*="field--name-field-body"] p:lt(3)')
    .text()
    .trim()
    .replace(/[\r\t\n\s]+/g, ' ');
  const date = $(elements)
    .find('div[class="block-region-content"] time')
    .text()
    .trim()
    .replace('at ', '');
  const timestamp = moment(date).unix();
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
          subtitle,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li[class="views-row"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
