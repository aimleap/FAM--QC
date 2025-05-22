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
  description: 'Leak Site',
  isCloudFlare: false,
  name: 'Slug Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://3ytm3d25hfzvbylkxiwyqmpvzys5of7l4pbosm7ol7czlkplgukjq6yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).find('div a').attr('href');
    const title = $(el).find('div a h2').text().trim();
    const date = $(el).find(' div[class="post-info"] span').text().trim();
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2[class="post-title"]').text().trim();
    const date = $(el)
      .find('div[class="post-info post-detail-info"] span')
      .text()
      .trim();
    const articlefulltext = $(el)
      .find('div[class="post-content"]')
      .text()
      .replace(/^\s+|\s+$/gm, ' ')
      .trim();
    const timestamp = moment(date, 'YYYY-MM-DD').unix();
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
            date,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['section[class="post-item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
