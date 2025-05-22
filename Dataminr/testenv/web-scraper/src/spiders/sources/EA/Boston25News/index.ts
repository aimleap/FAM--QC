import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

import { appendPaths } from '../../../../lib/urlUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Boston 25 News',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.boston25news.com/',
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = String($(el).find('h2').find('a').attr('href')).replace(
      'https://www.boston25news.com/',
      '',
    );
    const title = $(el)
      .find('h2')
      .find('a')
      .text()
      .replace(/^\s+|\s+$/gm, '');
    const time = $(el).find('div[class="article-meta"] time').text().replace('at ', '');
    const timestamp = time === undefined
      ? moment().unix()
      : adjustTimezone(
        moment.utc(time, 'MMMM DD, YYYY hh:mm a ZZZ').format('YYYY-MM-DD hh:mm A'),
        TIME_ZONE['America/New_York'],
      );
    items.push({
      title,
      link: appendPaths([source.url, link]),
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
  return elements
    .map((el) => {
      const articletext = $(el)
        .find('div[class="advanced-grid-2 layout-section"] p')
        .contents()
        .text()
        .replace(/^\s+|\s+$/gm, '')
        .trim();
      const text = $(el)
        .find('h1')
        .text()
        .replace(/^\s+|\s+$/gm, '')
        .trim();
      const time = $(el).find('div[class="hidden_sm"] time').text();
      const timestamp = adjustTimezone(
        moment.utc(time, 'MMMM DD, YYYY / hh:mm a ZZZ').format('YYYY-MM-DD hh:mm A'),
        TIME_ZONE['America/New_York'],
      );
      return new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            text,
            articlefulltext: articletext,
            ingestpurpose: 'mdsbackup',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      );
    }, [])
    .filter(Boolean);
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['section[id="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
