import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: true,
  name: 'Black Hat Pro Tools',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.blackhatprotools.info/',
  requestOption: {
    method: 'GET',
    headers: {
      authority: 'www.blackhatprotools.info',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const allowedSections = [
    '💰💰 VIP MONEY MAKING METHODS - VIP PRIVATE SECTION 💰💰',
    '💰💰 VIP E-COMMERCE & TRAFFIC SECTION - VIP PRIVATE SECTION 💰💰',
    '۩۞۩ BLACKHATPROTOOLS ELITE VIP SEO TOOLS PRIVATE SECTION ۩۞۩',
    'PUBLIC FORUMS (FOR REGISTERED MEMBERS ONLY)',
    'Buy & Sell Section',
  ];
  const allowedSections2 = [
    'Exclusive Freebies & WSOs',
    'BlackHat VIP SEO Tools & e-Commerce Bots & Softwares',
    'Monetizing Techniques & Ebooks & Discussions',
  ];
  elements.forEach((el) => {
    const categoryName = $(el).find('span[class="forumtitle"]').text().trim();
    if (allowedSections.includes(categoryName)) {
      const threadElements = $(el).find('li.forumbit_post.L2').get();
      threadElements.forEach((el1) => {
        const linkHref = $(el1).find('p[class="lastposttitle"] a[title]').attr('href');
        if (linkHref) {
          const title = $(el1).find('div[class="titleline"] a').text().trim();
          if (
            (categoryName === '۩۞۩ BLACKHATPROTOOLS ELITE VIP SEO TOOLS PRIVATE SECTION ۩۞۩'
              || categoryName === 'Monetizing Techniques & Ebooks & Discussions')
            && !allowedSections2.includes(title)
          ) {
            return;
          }
          const link = encodeURI(`https://www.blackhatprotools.info/${linkHref}`);
          const time = $(el1).find('p[class="lastpostdate"]').text().trim();
          let timestamp: number;
          if (time.includes('Yesterday')) {
            const time2 = time.split(',')[1].trim();
            timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
          } else if (time.includes('Today')) {
            const time2 = time.split(',')[1].trim();
            timestamp = moment.utc(time2, 'hh:mm A').unix();
          } else {
            timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();
          }
          if (!title.includes('Adult')) {
            items.push({
              title,
              link,
              parserName: 'post',
              timestamp,
            });
          }
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
  response: any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const title = $(elements).find('span[class="threadtitle"] a').text().trim();
  const forumsection = $(elements).find('div[class="breadcrumb"] li:nth-of-type(4) a').text().trim();
  const entrySelector = $(elements).find('li[class="postbitlegacy postbitim postcontainer old"]:last').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('a[class*="username"] span').text().trim();
    const time = $(el).find('span[class="date"]').text().trim();
    const articlefulltext = $(el).find('div[class="content"]').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    let timestamp: number;
    let time2 = '';
    if (time.includes('Yesterday')) {
      time2 = time.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
    } else if (time.includes('Today')) {
      time2 = time.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').unix();
    } else {
      timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();
    }
    const datejoined = $(el).find('div[class="post_field"]:nth-of-type(1) dd').text().trim();
    const postNo = $(el).find('span[class="nodecontrols"] a[class="postcounter"]').text().trim() === '#1';
    const finalText = formatText(postNo, title, articlefulltext, username);
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
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li.forumbit_nopost.L1'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="pageWrapper"]'],
      handler: postHandler,
    },
  ],
  1440,
);
