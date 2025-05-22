import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
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
  name: 'Blackhat Carding Forums',
  type: SourceTypeEnum.FORUM,
  url: 'https://bhcforums.cc/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];

  const entryselector = $(elements).find('table[class="tborder"]').get();
  entryselector.forEach((el) => {
    const title1 = $(el).find('div strong a').text().trim();
    if (title1 && !title1.includes('Community') && !title1.includes('Porn Section')) {
      const entryselector1 = $(el).find('tr td:nth-child(2)').get();

      entryselector1.forEach((el1) => {
        const title = $(el1).find('span[class="threadtext"] a').text().trim();
        const link = `https://bhcforums.cc/${$(el1)
          .find('span[class="threadtext"] a')
          .attr('href')}`;

        const time = $(el1)
          .find('span[class="smalltext"]')
          .text()
          .trim()
          .split('by')[0]
          .trim();

        let timestamp: number;

        if (time.includes('Yesterday')) {
          const time2 = time.split(',')[1].trim();
          timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
        } else if (time.includes('Today')) {
          const time2 = time.split(',')[1].trim();
          timestamp = moment.utc(time2, 'hh:mm A').unix();
        } else if (time.includes('ago')) {
          timestamp = parseRelativeTimestamp(time);
        } else {
          timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();
        }

        threads.push({
          title,
          link,
          parserName: 'post',
          timestamp,
        });
      });
    }
  });

  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response:any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#pid')[1];
  const forumsection = $(elements)
    .find('span[class="crumbs"]  span:nth-child(2) a[class="crumb"]')
    .text()
    .trim();
  const title = $(elements).find('td[class="thead"] div >strong').text().trim();
  const entrySelector = $(elements).find(`div[id="post_${id}"]`).get();
  entrySelector.forEach((el) => {
    const articlefulltext = $(el).find('div[class="post_body scaleimages"]').clone().find('blockquote[class*="mycode_quote"]')
      .remove()
      .end()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const time = $(el).find('span[class="post_date2"]').text().trim();
    const username = $(el).find('div[class="posttext"] a').text().trim();
    const joined = $(el)
      .find('div[class="author_statistics"]')
      .text()
      .trim()
      .split('Joined: ')[1]
      .split('Reputation: ')[0];

    let timestamp: number;
    let time2 = '';
    if (time.includes('Yesterday')) {
      time2 = time.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').subtract(1, 'days').unix();
    } else if (time.includes('Today')) {
      time2 = time.split(',')[1].trim();
      timestamp = moment.utc(time2, 'hh:mm A').unix();
    } else if (time.includes('ago')) {
      timestamp = parseRelativeTimestamp(time);
    } else {
      timestamp = moment.utc(time, 'MM-DD-YYYY, hh:mm A').unix();
    }

    const postId = $(el).find('div[class="post_head"] strong a').text().replace('#', '')
      .trim();

    let text = '';
    if (parseInt(postId, 10) > 1) {
      text = `${username} : ${articlefulltext}`;
    } else {
      text = `${username} : ${title}, ${articlefulltext}`;
    }

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
            username,
            joined,
            title,
            forumsection,
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
      selector: ['*'],
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
