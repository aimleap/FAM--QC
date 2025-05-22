import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Cal coast News',
  type: SourceTypeEnum.FORUM,
  url: 'https://calcoastnews.com/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = String($(el).find('a').attr('href'));
    const title = $(el).find('a').text();
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
  return elements
    .map((el) => {
      const articletext = $(el)
        .find("div[class = 'post'] >p")
        .contents()
        .text()
        .replace(/^\s+|\s+$/gm, '')
        .trim();
      const description = $(el)
        .find('div[class = "post"] >p:nth-child(6)')
        .text()
        .replace(/^\s+|\s+$/gm, '');
      const time = $(el).find('h5').text();
      const timestamp = adjustTimezone(
        moment.utc(time, 'MMMM DD, YYYY').format('YYYY-MM-DD hh:mm A'),
        TIME_ZONE['America/Los_Angeles'],
      );
      const title = $(el)
        .find('div.post')
        .find('h1')
        .text()
        .replace(/^\s+|\s+$/gm, '');
      const text = title.concat('\n', description);
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
            title,
            description,
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
      selector: ['div.info'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div.containerI'],
      handler: postHandler,
    },
  ],
  1440,
);
