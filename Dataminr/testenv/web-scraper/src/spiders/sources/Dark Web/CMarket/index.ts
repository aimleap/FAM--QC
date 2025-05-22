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
  description: 'Marketplace',
  isCloudFlare: false,
  name: 'CMarket',
  type: SourceTypeEnum.FORUM,
  url: 'http://cmarket2mkfnxbpjtd7moahl2vel3r7bbix2mibljappe4bmwzbejtad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text().trim();
    const link = `${source.url}${$(el).attr('href')}`;
    const timestamp = moment().unix();
    threads.push({
      title,
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
  const title = $(elements).find('div p:nth-of-type(1) span').text().trim();
  const articlefulltext1 = $(elements)
    .find('p[style="font-size:1.1em"]')
    .text()
    .trim();
  const articlefulltext2 = $(elements).find('table tr').text().trim();
  let articlefulltext = `${articlefulltext1} ${articlefulltext2}`;
  if (articlefulltext === '') {
    articlefulltext = $(elements).find('div p:nth-of-type(2)').text().trim();
  }
  const price = $(elements).find('div p:nth-of-type(2) span').text().trim();
  const timestamp = moment().unix();
  const text = `${title}\n${articlefulltext}`;
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
          articlefulltext,
          price,
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
      selector: ['tr td a'],
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
