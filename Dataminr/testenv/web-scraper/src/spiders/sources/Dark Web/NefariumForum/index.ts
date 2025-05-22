import moment from 'moment';
import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Nefarium Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://zcfl6nxpefzmythaqbqi7s3fgjsb4tobp7stonwaqrhtza7yn3ztijid.onion/',
};
async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://zcfl6nxpefzmythaqbqi7s3fgjsb4tobp7stonwaqrhtza7yn3ztijid.onion/${$(el).find('a').attr('href')}`;
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  });
  return items;
}
async function threadHanlder(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('span[class=" subject_new"] a').text().trim();
    const link = `http://zcfl6nxpefzmythaqbqi7s3fgjsb4tobp7stonwaqrhtza7yn3ztijid.onion/${$(el).find('span[class=" subject_new"] a').attr('href')}`;
    const date = $(el).find('span[class="lastpost smalltext"]').text().split('Last')[0].trim();
    let timestamp:number;
    let time2 = '';
    if (date.includes('Yesterday')) {
      time2 = date.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
    }
    if (date.includes('ago')) {
      timestamp = parseRelativeTimestamp(date);
    } else {
      timestamp = moment.utc(date, 'MM-DD-YYYY, hh:mm A').unix();
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
  const items: Post[] = [];
  const forum = $(elements).find('span[class="crust"]:nth-child(3) a:nth-child(1)').text().trim();
  const subforum = $(elements).find('span[class="crust"]:nth-child(4) a:nth-child(1)').text().trim();
  const title = $(elements).find('span[class="crust"]:nth-child(5) a:nth-child(1)').text().trim();
  const entrySelector = $(elements).find('div[class="post classic "]:last').get();
  entrySelector.forEach((el) => {
    const date = $(el).find('span[class="post_date"]').text().trim();
    let timestamp:number;
    let time2 = '';
    if (date.includes('Yesterday')) {
      time2 = date.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
    } if (date.includes('ago')) {
      timestamp = parseRelativeTimestamp(date);
    } else {
      timestamp = moment.utc(date, 'MM-DD-YYYY, hh:mm A').unix();
    }
    const thread = $(el).find('span[class="pbctext"]:nth-child(4)').contents().text()
      .split('Threads:')[1].split('\n')[0].trim();
    const joineddate = $(el).find('span[class="pbctext"]:nth-child(4)').contents().text()
      .split('Joined:')[1].split('\n')[0].trim();
    const articlefulltext = $(el).find('div[class="post_body scaleimages"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    items.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
            thread,
            joineddate,
            ingestpurpose: 'darkweb',
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
      name: 'main',
      selector: ['table.tborder:nth-child(3) tbody:nth-child(2) tr:nth-child(2) td:nth-child(1) table:nth-child(1) tbody:nth-child(1) tr:nth-child(1) td:nth-child(2) strong:nth-child(1)'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['tbody tr[class="inline_row"]'],
      handler: threadHanlder,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
