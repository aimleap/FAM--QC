import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Extremism',
  isCloudFlare: false,
  name: 'Ilam Foundation',
  type: SourceTypeEnum.FORUM,
  url: 'http://i3lam7sb2m367t3g7e57l3isedjnmmffy5ousw4peeml7hf2nsytbmad.onion/',
};

async function mainHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 1; i <= 5; i++) {
    items.push({
      title: '',
      link: `${source.url}page/${String(i)}/`,
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
    let title = '';
    [, , title] = $(el).text().trim().split('  ');
    const link = `http://i3lam7sb2m367t3g7e57l3isedjnmmffy5ousw4peeml7hf2nsytbmad.onion/${$(
      el,
    ).attr('href')}`;
    if (title === undefined) {
      title = '';
    }
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp: moment().unix(),
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
  let title: string;
  let [, , articletext] = $(elements).find('h1').text().trim()
    .split('  ');
  if (articletext !== undefined || articletext !== '') {
    [, title, articletext] = $(elements).find('h1').text().trim()
      .split('  ');
  } else {
    [title, articletext] = $(elements).find('h1').text().trim()
      .split('  ');
  }
  const time = $(elements).find('span[class="date meta-item tie-icon"]').text().trim();
  const timestamp = moment.utc(time, 'MMMM DD, YYYY').unix();
  articletext = articletext.replace(/[\t\n\s]+/g, ' ');
  const text = `${articletext}\n${title}`;
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
          articlefulltext: articletext,
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
      name: 'main',
      selector: ['*'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['h2[class="post-title"] a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['header[class="entry-header-outer"]'],
      handler: postHandler,
    },
  ],
  1440,
);
