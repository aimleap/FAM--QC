import moment from 'moment';
import { Response } from 'request';
import {
  appendLink, SourceType, ThreadType,
} from '../../lib/parserUtil';
import Post from '../../schema/post';
import { formatText, generateThreadId } from '../../lib/forumUtils';

export const getUnixTimestamp = (timestamp: string): number => moment.utc(timestamp.trim(), 'YYYY-MM-DDTHH:mm:ssZ').unix();

export function getIpbMainThreads(): ThreadType[] {
  const threads: ThreadType[] = [];
  const includeForums = [
    'https://rstforums.com/forum/forum/4-sectiunea-tehnica/',
    'https://rstforums.com/forum/forum/5-programe/',
  ];
  includeForums.forEach((el) => {
    threads.push({
      title: el.split('/')[5],
      link: el,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  });
  return threads;
}

export async function mainThreadHandler(): Promise<ThreadType[]> {
  return getIpbMainThreads();
}

export function getIpbThreads($: CheerioSelector, elements: CheerioElement[]): ThreadType[] {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('li[class="ipsDataItem_lastPoster__title"] a').attr('title');
    const rawLink = `${$(el).find('a[title="Go to last post"]').attr('href')}`;
    const link = rawLink.includes('?do=getLastComment')
      ? rawLink
      : `${rawLink}?do=getLastComment`;
    const timestamp = moment($(el).find('time').attr('datetime'), 'YYYY-MM-DDThh:mm:ssZ').unix();
    threads.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

export function getIpsPosts(
  $: CheerioSelector,
  elements: CheerioElement[],
  source: SourceType,
): Post[] {
  // @ts-ignore
  return elements
    .map((el) => {
      try {
        const $el = $(el);
        $el.find('blockquote').remove();
        const message = $el.find('div[data-role="commentContent"]').text().trim();
        const profileLink = $el.find('.cAuthorPane_author a[id]').attr('href') || '';
        const profileName = $el.find('.cAuthorPane_author a[id]').text();
        const timestamp = getUnixTimestamp($el.find('.ipsType_reset time').attr('datetime') || '');
        return new Post(
          message,
          {
            author_name: profileName,
            author_url: appendLink(source, profileLink),
            current_url: appendLink(
              source,
              $el.find('.ipsComment_tools li:last-child a').attr('href') || source.url,
            ),
          },
          timestamp,
          [],
        );
      } catch (e) {
        return null;
      }
    })
    .filter((x) => x !== null);
}

export async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  return getIpbThreads($, elements);
}

export async function postHandler(
  source: SourceType,
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const items: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#comment-')[1];
  const title = $(elements).find('h1[class="ipsType_pageTitle ipsContained_container"] span span').text().trim();
  const forumTopicDate = $(elements).find('h1[class="ipsType_pageTitle ipsContained_container"] + p time').attr('datetime');
  const forumsection = $(elements).find('div[class="focus-precontent"] ul[data-role="breadcrumbList"] li:nth-child(3) a span').text().trim();
  const entrySelector = $(elements).find(`article[id="elComment_${id}"]`).get();
  entrySelector.forEach((el) => {
    $(el).find('blockquote').remove();
    $(el).find('img').remove();
    const articlefulltext = $(el).find('div[data-role="commentContent"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const username = $(el).find('h3[class="ipsType_sectionHead cAuthorPane_author ipsType_blendLinks ipsType_break"] a').text().trim();
    const date = $(el).find('div[class="ipsType_reset ipsResponsive_hidePhone"] time').attr('datetime');
    const isFirstPost = date === forumTopicDate;
    const timestamp = getUnixTimestamp(date);
    const finalText = formatText(isFirstPost, title, articlefulltext, username);
    const threadId = generateThreadId(title);
    items.push(
      new Post(
        finalText,
        {
          current_url: finalRedirectedUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            username,
            title,
            forumsection,
            parent_uuid: threadId,
            ingestpurpose: 'deepweb',
          }),
        ),
      ),
    );
  });
  return items;
}
