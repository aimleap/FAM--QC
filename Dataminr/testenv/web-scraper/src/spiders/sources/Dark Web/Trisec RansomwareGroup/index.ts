import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Trisec Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://orfc3joknhrzscdbuxajypgrvlcawtuagbj7f44ugbosuvavg3dc3zid.onion/victim.html',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  const entrySelector = $(elements).find('td a').get();
  entrySelector.forEach((el) => {
    const title = $(el).text().replace('[*]', '').trim();
    const link = `http://orfc3joknhrzscdbuxajypgrvlcawtuagbj7f44ugbosuvavg3dc3zid.onion/${$(el).attr('href')}`;
    const timestamp = moment().unix();
    if (!title.includes('back')) {
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
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1').text().trim();
    const domain = $(el).find('h3').text().trim();
    const articlefulltext = $(el).find('p').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const timestamp = moment().unix();
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
            domain,
            articlefulltext,
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
      selector: ['tbody'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body main'],
      handler: postHandler,
    },
  ],
  1440,
);
