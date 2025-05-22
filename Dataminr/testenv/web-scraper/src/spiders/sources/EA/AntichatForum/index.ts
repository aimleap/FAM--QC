import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Antichat Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://forum.antichat.club/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements)
    .find('li[class*="node category level_1 node_"]')
    .get()
    .slice(2, 6);
  entrySelector.forEach((el) => {
    const title1 = $(el).find('div[class="categoryText"] h3 a').text().trim();
    const targetSubForums = [
      'Безопасность и Уязвимости',
      'Разработка',
      'Программирование',
      'Финансовые задачи/Социальные сети',
    ];
    if (title1 && targetSubForums.includes(title1)) {
      const entrySelector1 = $(el).find('li[class*="node forum level_2"]').get();
      entrySelector1.forEach((el1) => {
        const title = $(el1).find('h3.nodeTitle').text().trim();
        const link = `https://forum.antichat.club/${$(el1)
          .find('span.lastThreadTitle a')
          .attr('href')}`;
        const date = $(el1)
          .find('[class="DateTime muted lastThreadDate"]')
          .text()
          .split('at')[0]
          .trim();
        const timestamp = moment.utc(date, 'DD MMM YYYY').unix();
        items.push({
          title,
          link,
          parserName: 'post',
          timestamp,
        });
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
  const title = $(elements).find('div[class="titleBar"] h1').text().trim();
  const forumsection = $(elements)
    .find('span[itemscope="itemscope"]:nth-child(3) a span')
    .text()
    .trim();
  const entrySelector = $(elements).find('li.sectionMain.message:last').get();
  entrySelector.forEach((el) => {
    const postnumber1 = $(el)
      .find('a.item.muted.postNumber.hashPermalink.OverlayTrigger')
      .text()
      .trim();
    if (postnumber1) {
      const username = $(el).find('a[itemprop="name"]').text().trim();
      const articlefulltext = $(el)
        .find('div.messageContent')
        .clone()
        .find('div.bbCodeBlock.bbCodeQuote')
        .remove()
        .end()
        .text()
        .replace(/[\t\n\s]+/g, ' ')
        .trim();
      const datejoined = $(el).find('div.extraUserInfo dl:nth-child(1) dd').text().trim();
      const date = $(el).find('a.datePermalink .DateTime').text().split('at')[0].trim();
      const timestamp = moment.utc(date, 'DD MMM YYYY').unix();
      const isFirstPost = $(el).find('div.messageDetails a.item.muted.postNumber').text().trim() === '#1';
      const finalText = formatText(isFirstPost, title, articlefulltext, username);
      const threadId = generateThreadId(title);
      posts.push(
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
              joined: datejoined,
              title,
              forumsection,
              parent_uuid: threadId,
              ingestpurpose: 'deepweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });

  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[id="content"]'],
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
