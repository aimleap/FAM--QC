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
  name: 'AltCoins Talks',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.altcoinstalks.com/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    let timestamp: number;
    let time = '';
    const title = $(el).find('a:nth-of-type(2)').attr('title');

    const link = $(el).find('a:nth-of-type(2)').attr('href');

    time = $(el)
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .split(' on ')[1]
      .trim();
    if (time.includes('Yesterday')) {
      time = time.split('at')[1].trim();
      timestamp = moment.utc(time, 'hh:mm:ss A').subtract(1, 'days').unix();
    } else if (time.includes('Today')) {
      time = time.split('at')[1].trim();
      timestamp = moment.utc(time, 'hh:mm:ss A').unix();
    } else {
      timestamp = moment.utc(time, 'MMMM DD, YYYY, hh:mm:ss A').unix();
    }
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

  const id = url.split('msg')[1].split('#')[0];
  const titleElement = $(elements).find(`h5[id="subject_${id}"] a`);
  const title = titleElement.length > 1
    ? $(elements).find('h3[class="catbg"]').text().split(':')[1]
    : titleElement.text().trim();

  const description = $(elements).find(`div[id="msg_${id}"]`).text().trim();

  let unixTimestamp; // Declare the variable outside the loop

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const smallTextElement = $(element).find('div.smalltext');
    const timeText = smallTextElement.text();

    const regex = /(\w+\s\d{1,2},\s\d{4},\s\d{1,2}:\d{2}:\d{2}\s[AP]M)|Today at \d{1,2}:\d{2}:\d{2}\s[AP]M/;
    const matches = timeText.match(regex);

    if (matches) {
      const [time] = matches;

      if (time.includes('Yesterday') || time.includes('Today')) {
        const timeComponents = time.split('at')[1].trim();
        const timestamp = moment.utc(timeComponents, 'hh:mm:ss A');

        if (time.includes('Yesterday')) {
          timestamp.subtract(1, 'days');
        }

        unixTimestamp = timestamp.unix();
      } else {
        const timestamp = moment.utc(time, 'MMM DD, YYYY, hh:mm:ss A');
        unixTimestamp = timestamp.unix();
      }
    }
  }

  const text = `${title}\n${description}`;
  posts.push(
    new Post(
      text,
      {
        current_url: url,
      },
      unixTimestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          description,
          ingestpurpose: 'deepweb',
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
      selector: ['td[class="lastpost"] p'],
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
