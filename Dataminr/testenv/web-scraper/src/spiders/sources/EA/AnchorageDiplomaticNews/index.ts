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
  name: 'Anchorage Diplomatic News',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.adn.com/section/alaska-news/military/',
  randomDelay: [5, 10],
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('a').attr('href');
    const time = $(el)
      .find('time[class="primary-font__PrimaryFontStyles-o56yd5-0 fkTVRF date story-date"]')
      .text()
      .replace('at ', '');
    const timestamp = adjustTimezone(
      moment.utc(time, 'MMMM DD, YYYY hh:mm a').format('YYYY-MM-DD hh:mm A'),
      TIME_ZONE['US/Alaska'],
    );
    const title = String($(el).find('a h2').text()).concat('\n', time);
    items.push({
      title,
      link: appendPaths(['https://www.adn.com', link]),
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
      const articletext = String($(el).find('article[id="article-body"] p').contents().text())
        .replace(/(\r\n|\n|\r)/gm, '')
        .trim();
      const date = String($(el).find('div[class="date"] span:nth-child(2)').text()).split(': ')[1];
      const timestamp = adjustTimezone(
        moment.utc(date, 'MMMM DD, YYYY').format('YYYY-MM-DD hh:mm A'),
        TIME_ZONE['US/Alaska'],
      );
      const title = $(el).find('h1').text();
      const time = '';
      const subtitle = $(el)
        .find('article[id="article-body"] p')
        .contents()
        .first()
        .text()
        .replace(/(\r\n|\n|\r)/gm, '')
        .trim();
      const text = title.concat('\n', subtitle, '\n', date, '\n', time);
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
            tilte: title,
            subtitle,
            date,
            time,
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
      selector: ['div[class="list-item "]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: [
        'div[class="col-sm-md-12 col-lg-xl-8 left-article-section ie-flex-100-percent-sm layout-section"]',
      ],
      handler: postHandler,
    },
  ],
  1440,
);
