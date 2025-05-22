import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Breaking Bad Forums',
  type: SourceTypeEnum.FORUM,
  url: 'http://bbzzzsvqcrqtki6umym6itiixfhni37ybtt7mkbjyxn2pgllzxf2qgyd.onion/',
};

async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  const excludeForums = ['Chemsex', 'Off Topic Boards'];

  elements.forEach((ele) => {
    const mainForum = $(ele).find('h2').text().trim();
    if (excludeForums.includes(mainForum)) {
      return; // Exit this iteration of forEach without adding anything
    }
    const entrySelector = $(ele).find('div[class="node-body"]').get();
    entrySelector.forEach((el) => {
      const subForum = $(el).find('h3 a').text().trim();
      if (excludeForums.includes(subForum)) {
        return;
      }
      const title = $(el).find('a[class="node-extra-title"]').text().trim();
      const link = `http://bbzzzsvqcrqtki6umym6itiixfhni37ybtt7mkbjyxn2pgllzxf2qgyd.onion${$(el).find('a[class="node-extra-title"]').attr('href')}`;
      const timestamp = Number($(el).find('time').attr('data-time'));

      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    });
  });

  return threads;
}

function formatText(
  isFirstPost: boolean,
  threadTitle: string,
  postText: string,
  userName: string,
): string {
  if (isFirstPost) return `${userName}: ${threadTitle}; ${postText}`;
  return `${userName}: ${postText}`;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const link = url.split('post-')[1];
  const title = $(elements).find('h1').text().trim();
  const threadId = generateThreadId(title);
  const forumSection = $(elements).find('ul[class="p-breadcrumbs "] li:last-child').text().trim();
  const entrySelector = $(`article[data-content="post-${link}"]`).get();
  entrySelector.forEach((el) => {
    const isFirstPost = $(el).find('ul[class="message-attribution-opposite message-attribution-opposite--list "] li:last-child a').text().trim() === '#1';
    $(el).find('div[class="bbWrapper"] blockquote').remove();
    const username = $(el).find(`div[data-lb-id="post-${link}"]`).attr('data-lb-caption-desc').split(' ')[0].trim();
    const articletext = $(el).find('div[class="bbWrapper"]').contents().text()
      .replace(/[\t\n\s]+/g, ' ');
    const string = $(el).find(`div[data-lb-id="post-${link}"]`).attr('data-lb-caption-desc');
    const regex = /\b[A-Za-z]{3} \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M\b/;
    const match = string.match(regex);
    let dateTime = '';
    if (match) {
      dateTime = match[0].replace('at', '');
    }
    let timestamp = moment.utc(dateTime, 'MMM DD, YYYY  hh:mm A').unix();
    if (timestamp === 0) {
      timestamp = moment().unix();
    }
    const finalText = formatText(isFirstPost, title, articletext, username);
    const joined = $(el).find('div[class="message-userExtras"] dl:first-child dd').text().trim();
    posts.push(new Post(
      finalText,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          username,
          joined,
          title,
          forumSection,
          parent_uuid: threadId,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class*="block block--category"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
