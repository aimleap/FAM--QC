import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: true,
  name: 'Tor Depot',
  type: SourceTypeEnum.FORUM,
  url: 'http://depotzmeg75ja4a6uswjwmsqi7pfokfiz3hzywgn4q3gihsixhmmcwqd.onion/',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      Cookie:
        'XSRF-TOKEN=eyJpdiI6ImRDcmpRMmxOZGtDSGlqU1FqK3BKYnc9PSIsInZhbHVlIjoiaCtscVRBL1Y3dXcvcmkyakJFa2RMOHd2a1pwZE5RQWFObDJSbjROZFlQNkQ2VzE5ekNmQUlFamN2L0tRMFhyVnppSG5PaUZiYlg5Vkh2SE9tTk9JbmQza042REVsVk1Ja3BjSW1GTmJSaVRJaXJpQkozbDQyOFd6U0JqQitYcHAiLCJtYWMiOiJhOTVhNzcwZWQzMmUyZDdjYTViNzBhZmUwZDc4NTgzNTg5YzU5NGZhZTljMDYyZTRlZjM2ZDRhNGYxYmVkYTQ4In0%3D; expires=Wed, 17-Jan-2024 16:36:34 GMT; Max-Age=7200; path=/',
    },
  },
};

async function mainHandler($: CheerioSelector, elements: CheerioElement[]): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).attr('href');
    const title = $(el).find('h5').text().trim();
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'thread',
      requestOption: {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US;q=0.5,en;q=0.3',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          Cookie:
            'XSRF-TOKEN=eyJpdiI6ImRDcmpRMmxOZGtDSGlqU1FqK3BKYnc9PSIsInZhbHVlIjoiaCtscVRBL1Y3dXcvcmkyakJFa2RMOHd2a1pwZE5RQWFObDJSbjROZFlQNkQ2VzE5ekNmQUlFamN2L0tRMFhyVnppSG5PaUZiYlg5Vkh2SE9tTk9JbmQza042REVsVk1Ja3BjSW1GTmJSaVRJaXJpQkozbDQyOFd6U0JqQitYcHAiLCJtYWMiOiJhOTVhNzcwZWQzMmUyZDdjYTViNzBhZmUwZDc4NTgzNTg5YzU5NGZhZTljMDYyZTRlZjM2ZDRhNGYxYmVkYTQ4In0%3D; expires=Wed, 17-Jan-2024 16:36:34 GMT; Max-Age=7200; path=/',
        },
      },
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = $(el).attr('href');
    const title = $(el).find('h5').text().trim();
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
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4[class="product-name"]').text().trim();
    const price = $(el).find('p[class="price"] span').text().trim();
    const articlefulltext = $(el)
      .find('div[id="product-details-tab"]')
      .contents()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const sku = $(el).find('p[class="p-sku"] span').text().trim();
    const soldby = $(el).find('p[class="stor-name"]').text().trim();
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${title}\n${price}`,
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
            articlefulltext,
            sku,
            soldby,
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
      name: 'main',
      selector: ['div[class="container-fluid"] a[class="single-category"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="row"] a[class="item"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['section[class="product-details-page"]'],
      handler: postHandler,
    },
  ],
  1440,
);
