import moment from 'moment';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Play Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion/',
  expireIn: 200,
};

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const pages = Number(
    $(elements)
      .attr('onclick')
      .trim()
      .replace("goto_page('", '')
      .replace("')", ''),
  );
  let link = '';
  for (let page = 1; page <= pages; page++) {
    link = `http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion/index.php?page=${String(
      page,
    )}`;
    items.push({
      title: `page=${String(page)}`,
      link,
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
    const id = String(
      $(el).attr('onclick').trim().split("viewtopic('")[1].split("')")[0],
    );
    const link = `http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion/topic.php?id=${String(
      id,
    )}`;
    const title = $(el)
      .text()
      .replace(/^\s+|\s+$/gm, '')
      .trim();
    const time = String($(el).find('div div div div').contents().text())
      .split(/\r?\n/)[0]
      .split('publication date:')[0]
      .split('added:')[1]
      .replace(/^\s+|\s+$/gm, '')
      .trim();
    const timestamp = moment(time, 'YYYY-MM-DD').unix();
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
  const mes = String(
    $(elements).find('div div div div div div div div').contents().text(),
  )
    .trim()
    .replace(/^\s+|\s+$/gm, '')
    .match(/information:\s*(.*?)\s*comment:/);
  // @ts-ignore
  const message = mes[0].replace('information:', '').replace('comment:', '');
  const time = String(
    $(elements).find('div div div div div div').contents().text(),
  )
    .split(/\r?\n/)[0]
    .split('publication date:')[0]
    .split('added:')[1]
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  const domain = String($(elements).find('div div div').contents().text())
    .split(/\r?\n/)[0]
    .split('views:')[0]
    .replace(/^\s+|\s+$/gm, '')
    .trim();
  const temp = String($(elements).find('div div').contents().text())
    .trim()
    .split(' ')[0];
  const profileName = String($(elements).find('div').contents().text())
    .split(temp)[0]
    .trim();
  const timestamp = moment(time, 'YYYY-MM-DD').unix();
  posts.push(
    new Post(
      profileName,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: profileName,
          profileName,
          domain,
          message,
          ingestpurpose: 'mdsbackup',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'main-thread',
      selector: ['th span[class="Page"]:last-child'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['th[class="News"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['tbody th[class="News"]'],
      handler: postHandler,
    },
  ],
  1440,
);
