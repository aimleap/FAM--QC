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
  description: 'Forums',
  isCloudFlare: false,
  name: 'Bunker Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://bunkerapkk334hqopst6ur63mrjs4ls25z22x4telrvo5yn3c3llk3ad.onion/',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements)
    .find('div[class="terminal-card"]')
    .get()
    .slice(0, 2)
    .concat($(elements).find('div[class="terminal-card"]').get().slice(3, 10));
  entrySelector.forEach((el) => {
    const title = $(el).find('header').text().trim();
    const link = `http://bunkerapkk334hqopst6ur63mrjs4ls25z22x4telrvo5yn3c3llk3ad.onion${
      $(el).find('a').attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('tbody tr').get();
  entrySelector.forEach((el) => {
    const link1 = $(el).find('th a').attr('href');
    if (link1) {
      const link = `http://bunkerapkk334hqopst6ur63mrjs4ls25z22x4telrvo5yn3c3llk3ad.onion${
        link1}`;
      const title = $(el).find('th a').text().trim();
      const date = $(el)
        .find('td[class="text-center"]:nth-of-type(1)')
        .text()
        .trim();
      const timestamp = moment.utc(date, 'DD/MM/YYYY').unix();
      items.push({
        title,
        link,
        timestamp,
        parserName: 'post',
      });
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
  response: any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const title = $(elements)
    .find('div[class="container"] section header h2:first')
    .text()
    .replace('Ver Tema:', '')
    .trim();
  const entrySelector = $(elements).find('div[class="post"]:last').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('i a').text().trim();
    const articlefulltext = $(el)
      .find('p[class="content"]')
      .contents()
      .text()
      .trim();
    const text = articlefulltext
      .replace(/(https?|http):\/\/[^\s]+/g, '')
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    const date = $(el)
      .find('p[class="meta"] i')
      .text()
      .replace('a las', '')
      .replace('Posteado el', '')
      .trim();
    const timestamp = moment.utc(date, 'DD/MM/YYYY hh:mm A').unix();
    posts.push(
      new Post(
        `${text}\n${title}`,
        {
          current_url: finalRedirectedUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext,
            username,
            date,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main',
      selector: ['section[class="forumList"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="container"] section table'],
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
