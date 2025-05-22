import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News Website',
  isCloudFlare: false,
  name: 'Brilon Volunteer Fire Brigade',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.feuerwehr-brilon.de/',
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: '',
      link: `${source.url}?paged=${String(i)}`,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2 a').text().trim();
    const link = $(el).find('h2 a').attr('href');
    const datetext = $(el).find('p[class="prefix"]').text();
    const date = datetext.slice(datetext.indexOf(' ') + 1);
    moment.locale('de');
    const timestamp = moment(date, 'DD. MMMM YYYY').add(3, 'hours').utc().unix();
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
    const title = $(el).find('div[class="post"] h2 a').text().trim();
    const datetext = $(el).find('p[class="prefix"]').text();
    const date = datetext.slice(datetext.indexOf(' ') + 1);
    const articlefulltext = $(el).find('div.entry p').clone().find('a')
      .remove()
      .end()
      .map((_, element) => $(element).text().trim())
      .get()
      .join(' ');
    moment.locale('de');
    const timestamp = moment(date, 'DD. MMMM YYYY').add(3, 'hours').utc().unix();
    items.push(
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
            articlefulltext,
            ingestpurpose: 'deepweb',
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
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[id="content"] div[class="post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
