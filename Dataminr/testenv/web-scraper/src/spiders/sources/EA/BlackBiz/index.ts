import moment from 'moment';
import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Black Biz',
  type: SourceTypeEnum.FORUM,
  url: 'https://blackbiz.store',
  requestOption: { encoding: 'binary' },
};

async function categoryHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  const includeCategories = [
    'Рынок / Торговая площадка',
    'Софт/Программирование/Услуги',
    'Виды заработка в интернете',
    'Заработок в интернете: Общая информация',
  ];
  elements.forEach((el) => {
    const category = $(el).find('h2').text().trim();
    if (includeCategories.includes(category)) {
      const entrySelector = $(el).find('div[class="node-body"').get();
      entrySelector.forEach((ele) => {
        const title = $(ele).find('h3 a').text().trim();
        if (category === 'Заработок в интернете: Общая информация' && title === 'Мошенники/ Кидалы') return;
        const link = `${source.url}${$(ele).find('h3 a').attr('href')}`;
        const timestamp = moment().unix();
        threads.push({
          title,
          link,
          parserName: 'thread',
          timestamp,
        });
      });
    }
  });
  return threads;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = '';
    const link = `${source.url}${$(el).attr('href')}`;
    const timestamp = Number($(el).find('time').attr('data-time'));
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const entrySelector = $(elements).find(`article[data-content=${id}]`).get();
  const threadId = generateThreadId(title);
  entrySelector.forEach((el) => {
    const isFirstPost = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a',
      )
      .text()
      .trim() === '#1';
    $(el).find('div[class="bbWrapper"] blockquote').remove();
    const articlefulltext = $(el).find('div[class="bbWrapper"]').text().trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const username = $(el).find('div[class="message-userDetails"] a').text().trim();
    const forumSection = $(el)
      .find('ul[class="p-breadcrumbs "] li:last-child a span')
      .text()
      .trim();
    const text = formatText(isFirstPost, title, articlefulltext, username);
    posts.push(
      new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            username,
            forumSection,
            parent_uuid: threadId,
            ingestpurpose: 'deepweb',
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
      name: 'category',
      selector: ['div[class*="block block--category block--category"]'],
      handler: categoryHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="structItem-cell structItem-cell--latest"] a[href*="thread"]'],
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
