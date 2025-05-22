import moment from 'moment';
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
  isCloudFlare: true,
  name: '0day.red Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://0day.red/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    let time = '';
    const title = $(el).find('a[title]').attr('title');
    const link = `http://0day.red/${$(el).find('a:nth-child(1)').attr('href')}`;
    const timeElement = $(el);
    const timeText = timeElement.text().trim();
    if (timeText.includes('ago')) {
      time = timeElement.find('span[title]').attr('title');
    } else {
      const parts = timeText.split('...').pop()?.split('by');
      if (parts && parts.length > 1) {
        time = parts[0].trim();
      }
      if (timeText.includes('Yesterday')) {
        const time1 = timeElement.find('span[title]').attr('title');
        time = time1 + time;
      }
    }
    const timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();

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
  let timestamp: number;
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#pid')[1];
  const entrySelector = $(elements).find(`a[id="pid${id}"]+table `).get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="post_head"] a').attr('title');
    const articlefulltext = $(el)
      .find(`div[id="pid_${id}"]`)
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const postDateElement = $(el).find('span.post_date');
    let time = postDateElement.text();

    if (time.includes('ago')) {
      time = postDateElement.find('span[title]').attr('title');
    }

    if (time.includes('Yesterday')) {
      const time1 = postDateElement.find('span[title]').attr('title');
      time = time1 + time;
    }

    timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();

    const text = `${articlefulltext}`;
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
            entity: title,
            title,
            articlefulltext,
            ingestpurpose: 'deepweb',
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
      selector: ['tr td[width="19%"] span[class="smalltext"]'],
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
