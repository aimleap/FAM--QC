import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Wave Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://hmuidcgzsjlcsxe6rdluskevjtgynhupixpb7g5czmjpuftlhrl42bid.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title1 = $(el).find('div').text().trim();
    if (title1.includes('Show all')) {
      const link1 = $(el).attr('href');
      const title = link1.split('/')[2];
      const link = `http://hmuidcgzsjlcsxe6rdluskevjtgynhupixpb7g5czmjpuftlhrl42bid.onion${link1}`;
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        timestamp,
        parserName: 'thread',
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
    const title = $(el).find('div[class="title"]').text().trim();
    const link = `http://hmuidcgzsjlcsxe6rdluskevjtgynhupixpb7g5czmjpuftlhrl42bid.onion${$(el).find('a:nth-child(2)').attr('href')}`;
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
  elements.forEach((el) => {
    const title = $(el).find('div[class="heading"]:nth-of-type(2)').text().trim();
    const price = $(el).find('tbody tr td b').text().trim();
    const articlefulltext = $(el).find('div[class="tab1"]').text().replace(/^\s+|\s+$/gm, '')
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
      name: 'main',
      selector: ['div[class="categories"] a'],
      handler: mainHandler,
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
