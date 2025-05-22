import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Cuba Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://cuba4ikm4jakjgmkezytyawtdgr2xymvy6nvzgw5cglswg3si76icnqd.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').attr('href').split('/')[2];
    const link = `http://cuba4ikm4jakjgmkezytyawtdgr2xymvy6nvzgw5cglswg3si76icnqd.onion${$(el)
      .find('a')
      .attr('href')}`;
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
  const title = $(elements).find('div[class="page-h1"] span').text().trim();
  const articletext = $(elements)
    .find('p')
    .contents()
    .text()
    .trim()
    .replace(/(\r\n|\n|\r|\t)/gm, '');
  const website = articletext.split('website:')[1].split('files')[0].trim();
  const files = articletext.split('files:')[1].trim();
  const timestamp = moment().unix();
  const articlefulltext = articletext.replace(website, '').replace(files, '');
  posts.push(
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
          title,
          entity: title,
          domain: website,
          files,
          articlefulltext,
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
      selector: ['div[class="list-img"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="page-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
