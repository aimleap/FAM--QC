import moment from 'moment';
import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'CCtry',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.cctry.com/forum.php?mod=guide&view=newthread',
  requestOption: { encoding: 'binary' },
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: '',
      link: `${source.url}&page=${String(i)}/`,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('th[class="common"] a').text().trim();
    const link = $(el).find('td[class="by"]:nth-last-of-type(1) em a').attr('href');
    const date = $(el).find('td[class="by"]:nth-last-of-type(1) em a').text().replace('昨天', 'Yesterday')
      .replace('天前', 'days ago')
      .replace('小时前', 'hours ago')
      .replace('分钟前', 'minutes ago')
      .replace('今天', 'Today')
      .trim();
    let timestamp: number;
    let date1 = '';
    if (date.includes('Yesterday')) {
      date1 = date.replace('Yesterday', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').subtract(1, 'days').unix();
    } else if (date.includes('前天')) {
      date1 = date.replace('前天', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').subtract(2, 'days').unix();
    } else if (date.includes('Today')) {
      date1 = date.replace('Today', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').unix();
    } else if (date.includes('ago')) {
      timestamp = parseRelativeTimestamp(date);
    } else {
      timestamp = moment.utc(date, 'YYYY-MM-DD h:mm A').unix();
    }
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
    });
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
  const title = $(elements).find('span[id="thread_subject"]').text().trim();
  const forum = $(elements).find('div[id="pt"] a:nth-of-type(4)').text().trim();
  const subforum = $(elements).find('div[id="pt"] a:nth-of-type(5)').text().trim();
  const entrySelector = $(elements).find('table[class="plhin"]:last').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('a[class="xw1"]').contents().text()
      .trim();
    const articlefulltext = $(el).find('td[class="t_f"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const date = $(el).find('div[class="authi"] em').text().replace('发表于', '')
      .replace('昨天', 'Yesterday')
      .replace('天前', 'days ago')
      .replace('小时前', 'hours ago')
      .replace('分钟前', 'minutes ago')
      .replace('今天', 'Today')
      .trim();
    let timestamp: number;
    let date1 = '';
    if (date.includes('Yesterday')) {
      date1 = date.replace('Yesterday', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').subtract(1, 'days').unix();
    } else if (date.includes('前天')) {
      date1 = date.replace('前天', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').subtract(2, 'days').unix();
    } else if (date.includes('Today')) {
      date1 = date.replace('Today', '').trim();
      timestamp = moment.utc(date1, 'hh:mm A').unix();
    } else if (date.includes('ago')) {
      timestamp = parseRelativeTimestamp(date);
    } else {
      timestamp = moment.utc(date, 'YYYY-MM-DD h:mm:ss a').unix();
    }
    const postnumber = $(el).find('td[class="plc"] div[class="pi"]  strong em').text().trim();
    posts.push(
      new Post(
        articlefulltext,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            forum,
            subforum,
            articlefulltext,
            username,
            postnumber,
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
      name: 'main',
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="bm_c"] table tbody'],
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
