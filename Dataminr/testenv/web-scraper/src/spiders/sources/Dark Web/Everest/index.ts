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
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Everest Ransom',
  type: SourceTypeEnum.FORUM,
  url: 'http://ransomocmou6mnbquqz44ewosbkjk3o5qjsl3orawojexfook2j7esad.onion/',
  expireIn: 200,
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: '',
      link: `${source.url}page/${String(i)}/`,
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
  const titlesSet = new Set<string>();
  elements.forEach((el) => {
    const title = $(el)
      .find('h2[class*="entry-title"] a')
      .text()
      .replace('Data Leak', '')
      .replace('DataBase Leak', '')
      .replace('Files Leak', '')
      .replace('demo-leak', '')
      .replace('Full Leak', '')
      .trim();
    const link = $(el).find('h2[class*="entry-title"] a').attr('href');
    if (!titlesSet.has(title)) {
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        timestamp,
        parserName: 'post',
      });
      titlesSet.add(title);
    }
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
    const title = $(el).find('h1[class="entry-title"]').text().trim();
    const regex = /\b\d+\s+hours\b/gi;
    const rawarticletext = $(el).find('div[class="entry-content"]').contents().text();
    const articlefulltext = rawarticletext.replace(regex, '').replace(/[\t\n\s]+/g, ' ').trim().replace(/(https?|http):\/\/[^\s]+/g, '');
    const timestamp = moment().unix();
    if (title !== 'Page not Found') {
      items.push(
        new Post(
          `${title}\n${articlefulltext}`,
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
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
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
      selector: ['main[id="site-content"] article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id="site-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
