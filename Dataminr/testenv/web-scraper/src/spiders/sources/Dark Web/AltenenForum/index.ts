import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Altenen Forum',
  type: SourceTypeEnum.FORUM, // Ensure this enum is properly defined and imported
  url: 'http://dydaofm5uefuulnzb63uh6coodgbxlgndk4eosoopbekebttkdxshlyd.onion/', // Make sure you access this through Tor
  injectHeaders: true,
  randomDelay: [10, 15],
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('div[class="main_container"]').get();
  moment.locale('tr');
  entrySelector.forEach((el) => {
    const forumTitle = $(el).find('h3[class="catbg"] a[title]').text();
    if (forumTitle.includes('İllegal Sohbet') || forumTitle.includes('Alışveriş')) {
      const entrySelector1 = $(el).find('div[class="up_contain b_board"]').get();
      entrySelector1.forEach((el1) => {
        const sectionTitle = $(el1).find('div[class="info"] a').text();
        const title = sectionTitle;
        const time = $(el1).find('span[class="time"]').text().split('at')[0].trim();

        const timestamp = moment.utc(time, 'MMM DD, YYYY').unix();
        const link = $(el1).find('span[class="last_post"] a[title]').attr('href');
        if (link) {
          items.push({
            title,
            link,
            parserName: 'post',
            timestamp,
          });
        }
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
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h2[class="display_title"] span').text().trim();
  const forumsection = $(elements)
    .find('div[id="inner_section"] div[class="navigate_section"] li:nth-of-type(4) a span')
    .text()
    .trim();
  const entrySelector = $(elements).find('div[class*="windowbg class_msg"]:last').get();
  entrySelector.forEach((el) => {
    const postNo = $(el)
      .find('span[class="page_number floatright"]')
      .text()
      .replace('#', '')
      .trim();
    const username = $(el).find('h4 a').contents().text()
      .trim();
    const date = $(el).find('div[class="postinfo"] a').text().split('at')[0].trim();
    const timestamp = moment.utc(date, 'MMM DD, YYYY').unix();
    const articlefulltext = $(el)
      .find('div[class="inner"]')
      .clone()
      .find('blockquote[class]')
      .remove()
      .end()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    let text = '';
    if (parseInt(postNo, 10) > 1) {
      text = `${username} : ${articlefulltext}`;
    } else {
      text = `${username} : ${title}, ${articlefulltext}`;
    }

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
            username,
            title,
            forumsection,
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
      name: 'thread',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body[id="chrome"]'],
      handler: postHandler,
    },
  ],
  1440,
);
