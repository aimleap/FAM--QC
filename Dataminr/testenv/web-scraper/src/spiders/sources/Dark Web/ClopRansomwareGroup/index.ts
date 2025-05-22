import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Clop Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://santat7kpllt6iyvqbr7q4amdv6dzrh6paatvyrzl7ry3zm72zigf4ad.onion',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    if (
      title.includes('HOME')
      || title.includes('HOW TO DOWNLOAD')
      || title === ''
      || title.includes('ARCHIVE')
      || title.includes('Back')
    ) return;
    const link = `http://santat7kpllt6iyvqbr7q4amdv6dzrh6paatvyrzl7ry3zm72zigf4ad.onion${$(el).attr(
      'href',
    )}`;
    if (link.includes('archive')) return; // we only want to see new content
    const timestamp = moment().utc().unix();
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
      const entityDetails = $(el)
        .find('main[id="g-mainbar"] p:nth-child(1)')
        .contents()
        .text()
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .trim()
        .replace('COMING SOON ...', '')
        .trim();

      const leakedData = $(el)
        .find('main[id="g-mainbar"] p:nth-child(2) strong')
        .get()
        .map((e) => $(e).text())
        .join(' LEAKED-DATA: ')
        .replace('Information:', '')
        .trim();

      const timestamp = moment.utc().unix();
      return new Post(
        forumPaths[0],
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: entityDetails,
            metadata: leakedData,
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
      selector: ['a[class="g-menu-item-container"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main[id="g-mainbar"]'],
      handler: postHandler,
    },
  ],
  1440,
);
