import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, ThreadType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'Altenen Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://altenens.is',
  requestOption: {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9,id;q=0.8,ru;q=0.7',
      'cache-control': 'max-age=0',
      'if-modified-since': 'Tue, 13 May 2025 13:31:08 GMT',
      priority: 'u=0, i',
      referer: 'https://altenens.is/threads/esim.2744478/',
      'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
      cookie: 'xf_csrf=Q4y-Pq85LLCtTib_; xf_user=1591373%2CC9m_Xy7EO60eCJxqKisQJbk8SiSGpYw0nUxKn3jx; xf_session=904E1cBP3UuXtjZ2ELPWJPT7y1wuKWPE; PMBC=bf4fe5c6953bfca706640a7be8e85ba1',
    },
  },
  randomDelay: [30, 60],
};

interface Forums {
  [key: string]: string[];
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const targetCategories = [
    'Community',
    'Hacking & Cracking Zone',
    'ChatGPT Related',
    'Anonymity Section',
    'Making Money and Courses',
    'Gaming Zone',
    'Carding Zone',
    'Streaming and Social Media',
  ];

  const includeForums: Forums = {
    Community: ['General Discussion', 'International - No English'],
    'Hacking & Cracking Zone': [
      'Hacking',
      'Hacking Showoff',
      'Remote Administration',
      'Cracking Tools',
      'Cracking Tutorials & Other Methods',
      'Combolists and Configs',
      'Paid Softwares and Antivirus',
      'Other Accounts',
    ],
    'Gaming Zone': ['Steam Games Accounts'],
  };

  elements.forEach((ele) => {
    const mainTopic = $(ele).find('h2 a').text().trim();
    if (targetCategories.includes(mainTopic)) {
      const entrySelector = $(ele).find('div[class="node-body"]').get();
      entrySelector.forEach((el) => {
        const subTopic = $(el).find('h3 a').text().trim();
        if (
          [
            'ChatGPT Related',
            'Anonymity Section',
            'Making Money and Courses',
            'Streaming and Social Media',
            'Carding Zone',
          ].includes(mainTopic)
        ) {
          const title = $(el).find('a[class="node-extra-title"]').text().trim();
          const link = `https://altenens.is${$(el)
            .find('a[class="node-extra-title"]')
            .attr('href')
            .trim()}`;
          const timestamp = Number($(el).find('time').attr('data-timestamp'));
          items.push({
            title,
            link,
            parserName: 'post',
            timestamp,
          });
        } else if (includeForums[mainTopic].includes(subTopic)) {
          const title = $(el).find('a[class="node-extra-title"]').text().trim();
          const link = `https://altenens.is${$(el)
            .find('a[class="node-extra-title"]')
            .attr('href')
            .trim()}`;
          const timestamp = Number($(el).find('time').attr('data-timestamp'));
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
  response: Response,
): Promise<Post[]> {
  const excludeHackingSubforums = ['Hacking News', 'Video Tutorials', 'Free Ebook Hacking'];
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('post-')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forumsection = $(elements)
    .find('ul[class="p-breadcrumbs "] li:last-child span')
    .text()
    .trim();
  if (excludeHackingSubforums.includes(forumsection)) {
    return [];
  }
  const entrySelector = $(elements).find(`article[data-content="post-${id}"]`).get();
  entrySelector.forEach((el) => {
    $(el).find('div[class*="bbCodeBlock"]').remove();
    const username = $(el).find('div[class="message-userDetails"] h4').contents().text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-timestamp'));
    const joined = $(el)
      .find('div[class*="message-userExtras"] dl[class="pairs pairs--justified"]:nth-of-type(1) dd')
      .first()
      .text()
      .trim();
    const articlefulltext = $(el)
      .find('div[class="bbWrapper"]')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const threadId = generateThreadId(title);
    const isFirstPost = $(el)
      .find(
        'ul[class*="message-attribution-opposite message-attribution-opposite--list"] li:last-child a',
      )
      .text()
      .trim() === '#1';
    const postUrl = $(el)
      .find(
        'ul[class*="message-attribution-opposite message-attribution-opposite--list"] li:last-child a',
      )
      .attr('href');
    const finalText = formatText(isFirstPost, title, articlefulltext, username);
    posts.push(
      new Post(
        finalText,
        {
          current_url: `${source.url}${postUrl}`,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            username,
            joined,
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
      selector: ['div[class*="block block--category block--category"]'],
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
