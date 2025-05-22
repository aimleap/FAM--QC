import { Response } from 'request';
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
  name: 'Gerki Tor',
  type: SourceTypeEnum.FORUM,
  url: 'http://gerkifrm6ga4yh6iivdijl6i5wjsvslgmxgauwpf4qldeyv5rmo55fid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('span[data-preview-url]').text().trim();
    const link = `http://gerkifrm6ga4yh6iivdijl6i5wjsvslgmxgauwpf4qldeyv5rmo55fid.onion${$(el).find('td[class="dataList-cell dataList-cell--main dataList-cell--link"] a').attr('href')}`;
    const timestamp = Number($(el).find('time').attr('data-time'));
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
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('div[class="p-title "] h1').text().trim();
  const entryselector = $(`article[data-content="${id}"]`).get();
  entryselector.forEach((el) => {
    const username = $(el)
      .find('h4 a span')
      .text()
      .trim();
    const timestamp = Number($(el).find('time').attr('data-time'));
    const articlefulltext = $(el)
      .find('div[class="bbWrapper"]')
      .contents()
      .text()
      .trim()
      .replace(/[\r\t\n\s]+/g, ' ');
    const text = `${username}; ${title}; ${articlefulltext}`;
    posts.push(
      new Post(
        text,
        {
          current_url: finalRedirectedUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            articlefulltext,
            username,
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
      selector: ['tr[class="dataList-row"]'],
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
