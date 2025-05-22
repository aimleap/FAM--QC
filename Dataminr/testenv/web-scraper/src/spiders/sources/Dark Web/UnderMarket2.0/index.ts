import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'UnderMarket 2.0',
  type: SourceTypeEnum.FORUM,
  url: 'http://puyr3jb76flvqemhkllg5bttt2dmiaexs3ggmfpyewc44vt5265uuaad.onion/',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie:
        'PHPSESSID=b56c22beb3424aaba1556f1d98e774aa; _ddf9cb89-d8ea-4b12-879b-1bb4225ecb5d_=eyJ1c2VyQWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBMaW51eCB4ODZfNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMDkuMC4wLjAgU2FmYXJpLzUzNy4zNiIsInBsYXRmb3JtIjoiTGludXggaTY4NiIsImxhbmd1YWdlIjoiRW5nbGlzaCIsImFjY2VwdExhbmd1YWdlIjoiZW4tVVM7cT0wLjUsZW47cT0wLjMiLCJkZXZpY2UiOnsiYnJhbmQiOm51bGwsIm1vZGVsIjoiRGVmYXVsdCIsInBsYXRmb3JtIjoiTGludXggaTY4NiIsInR5cGUiOiJkZXNrdG9wIiwidmlld3BvcnRzIjp7ImhlaWdodCI6NzY4LCJ3aWR0aCI6MTAyNX19LCJvcmllbnRhdGlvbiI6ImxhbmRzY2FwZSJ9',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = $(el).find('a').attr('href');
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
  const title = $(elements).find('h1[class="entry-title"]').text().trim();
  const articletext = $(elements)
    .find('div[class="entry-content"] p')
    .text()
    .trim()
    .replace(/[\r\t\n\s]+/g, ' ');
  posts.push(
    new Post(
      articletext,
      {
        current_url: url,
      },
      moment().unix(),
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
      name: 'thread',
      selector: ['h2[class="entry-title"]'],
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
