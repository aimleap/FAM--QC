import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leak Website',
  isCloudFlare: false,
  name: 'MalasLocker Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://malas2urovbyyavjzaezkt5ohljvyd5lt7vv7mnsgbf2y4bwlh72doqd.onion/posts/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];

  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
    const date = $(el).find('time[class="g time"]').text().trim();
    const timestamp = moment.utc(date, 'DD/MM/YY').unix();
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
  const title = $(elements).find('h2').text().trim();
  const date = $(elements).find('div[class="post-date"] span').text().trim();
  const timestamp = moment.utc(date, 'MMMM DD,YYYY').unix();
  const articlefulltext = $(elements).find('section').contents().text()
    .trim();
  const files = $(elements)
    .find('div[class="content"] section h1#files + ul')
    .text()
    .trim()
    .replace('\n', ',');
  let description = '';
  if (files === '') {
    description = $(elements).find('section').contents().text()
      .trim();
  } else {
    description = $(elements).find('section p').contents().text()
      .trim();
  }

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
          description,
          files,
          date,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['ul[class="list"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
