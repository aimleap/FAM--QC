import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'Best Black Hat Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://bestblackhatforum.com/',
  injectHeaders: false,
  requestOption: {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'max-age=0',
      cookie: 'mybb[announcements]=0; mybb[threadread]=a%3A1%3A%7Bi%3A502821%3Bi%3A1724366363%3B%7D; mybb[forumread]=a%3A1%3A%7Bi%3A893%3Bi%3A1724366363%3B%7D; sid=6de6092bd4c35f3e618966d84c86c1c5; mybb[lastvisit]=1724414586; mybb[lastactive]=1724422255',
      priority: 'u=0, i',
      'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const includeSections = [
    'BBHF Community Marketplace',
    'BestBlackHatForum Video Marketing ( NEW Section )',
    'BlackHat SEO & WhiteHat SEO',
    'Earn Money Offline and Online',
  ];
  const includeSubSections = [
    'Black Hat SEO',
    'Amazon Forum',
    'APK section',
    'IPA Section',
  ];
  const entrySelector = $(elements).find('div[class="forums"] table').get();
  entrySelector.forEach((el) => {
    const sectionTitle = $(el).find('td[class="thead"] strong a').text().trim();
    if (includeSections.includes(sectionTitle)) {
      const entryRows = $(el).find('table tr').get();
      entryRows.forEach((el1) => {
        const subsectionTitle = $(el1).find('td[class*="trow"] strong a').text().trim();
        if (
          (sectionTitle === 'BlackHat SEO & WhiteHat SEO' && !includeSubSections.includes(subsectionTitle))
          || (sectionTitle === 'Earn Money Offline and Online' && !includeSubSections.includes(subsectionTitle))
        ) {
          return;
        }

        const link1 = $(el1).find('td:nth-of-type(5) span[class="smalltext"] a[title]').attr('href');
        if (link1) {
          const title = subsectionTitle;
          const link = `https://bestblackhatforum.com/${link1}`;
          const date = $(el1)
            .find('td:nth-of-type(5) span[class="smalltext"]')
            .find('a')
            .remove()
            .end()
            .text()
            .replace('by', '')
            .replace(/[\t\n\s]+/g, ' ')
            .trim();
          const timestamp = moment.utc(date, 'MM-DD-YYYY, hh:mm A').unix();
          if (!Number.isNaN(timestamp)) {
            items.push({
              title,
              link,
              timestamp,
              parserName: 'post',
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
  const items: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#pid')[1];
  const title = $(elements).find('td[class="thead"] h1').text().trim();
  const threadId = generateThreadId(title);
  const forumsection = $(elements).find('div[class="navigation"] a:nth-child(3)').text().trim();
  const entrySelector = $(elements).find(`table[id="post_${id}"]`).get();
  entrySelector.forEach((el) => {
    let timestamp: number;
    $(el).find('blockquote').remove();
    const articleFullText = $(el).find('div[class="post_body"]').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const username = $(el).find('td[class="post_author"] strong em').text().trim();
    const registrationDate = $(el).find('td[class="smalltext post_author_info"] div:nth-child(2)').text().trim()
      .split(':')[1].trim();
    let time = $(el).find('div[class="float_left smalltext"]').text().trim();
    const currentDate = new Date();
    if (time.includes('Today')) {
      time = time.replace('Today', currentDate.toLocaleDateString());
    } else if (time.includes('Yesterday')) {
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      time = time.replace('Yesterday', yesterday.toLocaleDateString());
    }
    if (time.includes('/')) {
      timestamp = moment.utc(time, 'MM/DD/YYYY, hh:mm A').unix();
    } else {
      timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();
    }
    const postNo = $(el).find('td[class="tcat"] span[class="smalltext"] strong a').text().trim() === '#1';
    const finalText = formatText(postNo, title, articleFullText, username);
    items.push(
      new Post(
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
            joined: registrationDate,
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
  return items;
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
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
