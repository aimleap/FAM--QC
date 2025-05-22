import moment from 'moment';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'Torbuy',
  type: SourceTypeEnum.FORUM,
  url: 'http://torbuyxpe6auueywlctu4wz6ur3o5n2meybt6tyi4rmeudtjsysayqyd.onion/',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Connection: 'keep-alive',
      Cookie: 'PHPSESSID=j0p1oblujdipv3ublk78t7uh83',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="vendore_title"] a').text().trim();
    const link = `http://torbuyxpe6auueywlctu4wz6ur3o5n2meybt6tyi4rmeudtjsysayqyd.onion${$(
      el,
    )
      .find('div[class="vendore_title"] a')
      .attr('href')}`;
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
  const posts: Post[] = [];
  const entrySelector = $(elements)
    .find('div[class="col-md-3 col-sm-4 col-xs-6 bx_catalog_item double"]')
    .get();
  entrySelector.forEach((el) => {
    const title = $(el)
      .find('div[class="bx_catalog_item_title"] a')
      .text()
      .trim();
    const price = $(el).find('div[class="bx_price"]').text().trim();
    const text = `${title}\n${price}`;
    const timestamp = moment().unix();
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
            entity: title,
            title,
            price,
            ingestpurpose: 'darkweb',
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
      selector: ['div[class="col-md-4 "]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="detail_vendore_elements"]'],
      handler: postHandler,
    },
  ],
  1440,
);
