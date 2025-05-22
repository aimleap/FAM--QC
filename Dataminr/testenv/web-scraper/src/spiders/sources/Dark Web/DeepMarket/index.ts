import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: true,
  name: 'DeepMarket',
  type: SourceTypeEnum.FORUM,
  url: 'http://deepmarli2lyewdfmx62ym2suhg32elt7rpnra2bgdg26qms7hqyecyd.onion/',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie: 'SSID=35c1afd982bc079f7f012a604a; language=en-gb; currency=USD',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  },
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').text().trim();
    const link = `http://deepmarli2lyewdfmx62ym2suhg32elt7rpnra2bgdg26qms7hqyecyd.onion${$(
      el,
    )
      .find('a')
      .attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
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
    const link = `http://deepmarli2lyewdfmx62ym2suhg32elt7rpnra2bgdg26qms7hqyecyd.onion${$(
      el,
    )
      .find('a[class="btn ven-btn"]')
      .attr('href')}`;
    const title = $(el).find('h3').text().trim();
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
  const vendor = $(elements).find('h1').text().trim();
  const articletext = $(elements)
    .find('div[class="vendor-description"] p')
    .contents()
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const entrySelector = $(elements).find('div[class="product-card"]').get();
  entrySelector.forEach((el) => {
    const timestamp = moment().unix();
    const title = $(el).find('a[class="product-name"]').text().trim();
    const price = $(el).find('div[class="price"]').text().trim();
    posts.push(
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
            vendor,
            articletext,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      name: 'main',
      selector: ['header ul[class="menu"] li[class="menu-item"]'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="vendor-card"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
