import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Qilin Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://kbsqoivihgdmwczmxkbovk7ss2dcynitwhhfu5yw725dboqo5kthfaad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class*="title"]').text().trim();
    const link = `http://kbsqoivihgdmwczmxkbovk7ss2dcynitwhhfu5yw725dboqo5kthfaad.onion${$(el).find('a[class*="title"]').attr('href')}`;
    const time = $(el).find('div[class*="upper"] div:last-child').text().trim();
    const timestamp = moment.utc(time, 'MMMM DD, YYYY').unix();
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
  forumpaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements)
    .find('div[class="page_title"]')
    .contents()
    .text()
    .trim();
  const website = $(elements)
    .find('div[class="col-md-8 col-xl-6"] div[class*="upper"] div a')
    .attr('href');
  const articletext = $(elements)
    .find('div[class="col-md-8 col-xl-6"]')
    .text()
    .replace(/[\r\t\n\s]+/g, ' ')
    .split(website)[0]
    .trim();
  const datasize = $(elements)
    .find(
      'div[class="col-md-8 col-xl-6"] div[class="item_box-info d-flex"] div:last-child',
    )
    .text()
    .trim();
  const time = $(elements)
    .find('div[class="col-md-8 col-xl-6"] div[class*="upper"] div:nth-child(2)')
    .text()
    .trim();
  const timestamp = moment.utc(time, 'MMMM DD, YYYY').unix();
  posts.push(
    new Post(
      `${articletext}\n${title}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          domain: website,
          title,
          company: title,
          datasize,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      name: 'thread',
      selector: ['div[class="item_box"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
