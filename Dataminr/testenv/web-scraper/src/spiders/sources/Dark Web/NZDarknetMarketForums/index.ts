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
  description: 'Forums',
  isCloudFlare: false,
  name: 'NZ Darknet Market Forums',
  type: SourceTypeEnum.FORUM,
  url: 'http://nzdnmfcf2z5pd3vwfyfy3jhwoubv6qnumdglspqhurqnuvr52khatdad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const time = $(el).find('a').text();
    const timestamp = time.includes('Yesterday')
      ? moment.utc(time.split(' ')[1], 'hh:mm').subtract(1, 'days').unix()
      : moment.utc(time, 'YYYY-MM-DD hh:mm').unix();
    const link = `${source.url}${$(el).find('a').attr('href')}`;
    threads.push({
      title: '',
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const id = url.split('#p')[1];
  const forum = $(elements)
    .find('div[class="linkst"] ul[class="crumbs"] li:nth-child(1) a')
    .text();
  const subforum = $(elements)
    .find('div[class="linkst"] ul[class="crumbs"] li:nth-child(2) a')
    .text();
  const title = $(elements)
    .find('div[class="linkst"] ul[class="crumbs"] li:nth-child(3) a')
    .text();
  const entrySelector = $(elements).find(`div[id="p${id}"]`).get();
  entrySelector.forEach((el: any) => {
    const articlefulltext = $(el)
      .find('div[class="postmsg"] p')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const author = $(el).find('div[class="postleft"] a').text().trim();
    const time = $(el).find('h2 a').text().trim();
    const timestamp = time.includes('Yesterday')
      ? moment.utc(time.split(' ')[1], 'hh:mm').subtract(1, 'days').unix()
      : moment.utc(time, 'YYYY-MM-DD hh:mm').unix();
    const postNumber = $(el).find('h2 span[class="conr"]').text().trim();
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
            author,
            postNumber,
            articlefulltext,
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
      selector: ['td[class="tcr"]'],
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
