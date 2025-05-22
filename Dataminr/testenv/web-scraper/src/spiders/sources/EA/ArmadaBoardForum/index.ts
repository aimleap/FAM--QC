import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'ArmadaBoard Forum',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.armadaboard.com/',
  entryUrl: 'tape.php',
  requestOption: {
    encoding: 'binary',
    headers: {
      authority: 'www.armadaboard.com',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a strong').text().trim();
    const link = `${source.url}${$(el)
      .find(' span[class="postdetails"] a:nth-child(3)')
      .attr('href')}`;
    const rawtime = $(el).find(' td[class="row1"] span[class="postdetails"]').text().trim();
    const time = rawtime.split('\n')[0];
    const regex = /\d+, \d{4} \d{1}:\d{2} (am|pm)/;
    const match = regex.exec(time);
    if (match) {
      const [matchedTime] = match; // Destructuring match array
      const timestamp = moment.utc(matchedTime, 'DD, YYYY hh:mm A').unix();
      threads.push({
        title,
        link,
        parserName: 'post',
        timestamp,
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
  response: { request: { href: any } },
): Promise<Post[]> {
  const items: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('a[class="maintitle"]').text().trim();
  const entrySelector = $(elements)
    .find(`tr td:nth-child(2) a[name="${id}"]`)
    .closest('tbody')
    .get();

  if (Array.isArray(entrySelector)) {
    entrySelector.forEach((el) => {
      const articlefulltext = $(el).find('span[class="postbody"]').text().trim();
      const time = $(el).find('td[width="100%"] span[class="postdetails"]').text().split(':')[1];
      moment.locale('ru');
      const username = $(el).find('span[style="font-size: 9px"]').text().trim();
      const registration = $(el).find('font[_msttexthash]').text().split(':')[1];
      const timestamp = moment.utc(time, 'MMM D, YYYY H').unix();
      items.push(
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
              entity: title,
              title,
              articlefulltext,
              username,
              registration,
              ingestpurpose: 'deepweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
  }
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['table[class="forumline"]  tr:nth-child(n+3)'],
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
