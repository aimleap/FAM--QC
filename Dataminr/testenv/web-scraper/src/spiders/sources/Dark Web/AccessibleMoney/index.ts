import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'Accessible Money',
  type: SourceTypeEnum.FORUM,
  url: 'http://aoi7xv6vzvnrf7uqhnmymyowpyedh2vdrxykyygdusjv2dhpl32ln6qd.onion',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('ul[class="navigation-menu"] li').get().slice(2);
  entrySelector.forEach((el) => {
    const link = `http://aoi7xv6vzvnrf7uqhnmymyowpyedh2vdrxykyygdusjv2dhpl32ln6qd.onion${$(el)
      .find('a')
      .attr('href')
      .replace('./', '/')}`;
    const timestamp = moment().unix();
    const title = $(el).find('a').text().trim();
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
  const entrySelector = $(elements).find('div[class="media-body"]').get();
  entrySelector.forEach((el) => {
    const Title = $(el).find('h5').text().trim();
    const amount = $(el).find('ul[class="list-unstyled"] li:first b').text().trim();
    const delivery = $(el).find('ul[class="list-unstyled"] li strong').text().trim();
    const price = $(el)
      .find('button[class="btn btn-warning btn-sm"] b')
      .text()
      .replace('Цена:\n', '')
      .trim();
    const articlefulltext = `${Title} ${amount} ${delivery} ${price}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${Title}\n${price}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: Title,
            Title,
            amount,
            delivery,
            price,
            articlefulltext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['*'],
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
