import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Dark Dock Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://oirolrkrppy6sei6x6bvkkdolc4cjqzqfhxisfzu6exqblahwrrvktyd.onion/',
};

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title1 = $(el).find('div').text().trim();
    if (title1.includes('Show all')) {
      const link = `http://oirolrkrppy6sei6x6bvkkdolc4cjqzqfhxisfzu6exqblahwrrvktyd.onion/${$(el).attr('href')}`;
      const title = link.split(/\/([^/]+)$/)[1];
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        parserName: 'thread',
        timestamp,
      });
    }
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).clone().find('div[class="seller"]').remove()
      .end();
    const link = `http://oirolrkrppy6sei6x6bvkkdolc4cjqzqfhxisfzu6exqblahwrrvktyd.onion${link1.find('a').attr('href')}`;
    const title = $(el).find('div[class="title"]').attr('title');
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="heading"]:first').text().trim();
    const price = $(el).find('div[class="information"] tbody td b:first').text().trim();
    const articlefulltext = $(el).find('div[class="tab1"]').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const timestamp = moment().unix();
    items.push(
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
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main-thread',
      selector: ['div[class="categories"] a'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="items"] div[class="item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
