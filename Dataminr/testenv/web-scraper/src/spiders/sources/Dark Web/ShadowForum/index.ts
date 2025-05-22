import moment from 'moment';
import { Response } from 'request';
import Post from '../../../../schema/post';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { formatText, generateThreadId } from '../../../../lib/forumUtils';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Forum site',
  isCloudFlare: false,
  name: 'Shadow Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://w4ljqtyjnxinknz4hszn4bsof7zhfy5z2h4srfss4vvkoikiwz36o3id.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const NotallowedSections = [
    'Forum Kuralları',
    'İtiraflar',
    'Porn',
    'Siyaset',
    'Dinler',
    'Konu Dışı',
    'Çöp Kutusu',
  ];
  const entrySelector = $(elements).find('div[class="forum"] tr').get();
  entrySelector.forEach((el) => {
    const link1 = $(el).find('span[class="smalltext"] a:nth-of-type(1)').attr('href');
    if (link1) {
      const title = $(el).find('strong a').text().trim();
      if (!NotallowedSections.includes(title)) {
        const link = `http://w4ljqtyjnxinknz4hszn4bsof7zhfy5z2h4srfss4vvkoikiwz36o3id.onion/${$(el).find('span[class="smalltext"] a:nth-of-type(1)').attr('href')}`;
        let date = $(el).find('span[class="smalltext"] span').attr('title');
        let timestamp = moment.utc(date, 'MM-DD-YYYY').unix();
        if (!date) {
          date = $(el).find('span[class="smalltext"]').text().split(',')[0].trim();
          timestamp = moment.utc(date, ' MM-DD-YYYY').unix();
        }
        if (!Number.isNaN(timestamp)) {
          items.push({
            title,
            link,
            timestamp,
            parserName: 'post',
          });
        }
      }
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
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id1 = finalRedirectedUrl.split('#')[1].replace('pid', '').trim();
  const title = $(elements).find('div[class="thead"] strong').text().trim();
  const subforum = $(elements).find('div[class="navigation"] a:nth-of-type(3)').text().trim();
  const entrySelector = $(elements).find(`div[id="post_${id1}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('strong span[class="largetext"] a').text().trim();
    const articlefulltext = $(el).find('div[class*="post_body"]').find('blockquote').remove()
      .end()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    let date = $(el).find('span[class="post_date"]').text().trim();
    let timestamp = moment.utc(date, 'MM-DD-YYYY, hh:mm A').unix();
    if (!timestamp) {
      date = $(el).find('span[class="post_date"] span[title]').attr('title');
      timestamp = moment.utc(date, ' MM-DD-YYYY').unix();
    }
    const postNo = $(el).find('div[class="post_head"] strong a').text().trim() === '#1';
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
            title,
            forumsection: subforum,
            parent_uuid: threadId,
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
      name: 'thread',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
