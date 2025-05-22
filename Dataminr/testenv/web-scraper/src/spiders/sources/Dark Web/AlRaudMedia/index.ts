import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Social Media Hacking',
  isCloudFlare: false,
  name: 'AlRaud Media',
  type: SourceTypeEnum.FORUM,
  url: 'http://dqhlysycv2uv2h3fay3cpopxuug6fxyp2reykt7lg67hnuonhm4iveqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).attr('aria-label');
    const link = `http://dqhlysycv2uv2h3fay3cpopxuug6fxyp2reykt7lg67hnuonhm4iveqd.onion${
      $(el).attr('href')}`;
    const timestamp = moment().unix();
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
  const title = $(elements).find('h1').text().trim();
  let articletext: string;
  let comment: string;
  let text: string;
  try {
    articletext = $('div[class="entry-content entry clearfix"] h3')
      .text()
      .trim();
    text = `${articletext}\n${title}`;
    comment = $(elements).find('h3[id="comments-title"]').text().trim();
  } catch (error) {
    articletext = '';
    text = `${title}`;
    comment = '';
  }

  const timestamp = moment().unix();
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
          entity: title,
          title,
          articletext,
          companyName: title,
          comment,
          ingestpurpose: 'darkweb',
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
      name: 'thread',
      selector: ['a[class="post-thumb"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['article[id="the-post"]'],
      handler: postHandler,
    },
  ],
  1440,
);
