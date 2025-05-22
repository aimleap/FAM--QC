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
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Trinixy Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://4p5n2nlu5md6ihulkhmtfuntswromnfwk2oqp2rke6k56mmv322bc3id.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://4p5n2nlu5md6ihulkhmtfuntswromnfwk2oqp2rke6k56mmv322bc3id.onion/${
      $(el).find('a').attr('href')}`;
    const title = $(el).find('a').text().trim();
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
  elements.forEach((el) => {
    const title1 = $(el).find('td span strong span').text().trim();
    if (title1) {
      const title = $(el).find('td span strong span').text().trim();
      const timestamp = moment().unix();
      const priceMethod1 = $(el)
        .find('td p span i')
        .text()
        .trim()
        .replace(/[-\n\s]+/g, ' ');
      const priceMethod2 = $(el)
        .find('td span span i')
        .text()
        .trim()
        .replace(/[-\n\s]+/g, ' ');
      let price = '';
      if (priceMethod1 !== '') {
        price = priceMethod1;
      } else {
        price = priceMethod2;
      }
      const articlefulltext = $(el)
        .find('+ tr td ul')
        .contents()
        .text()
        .replace(/[\t\n\s]+/g, ' ')
        .trim();
      posts.push(
        new Post(
          title,
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
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['li[class="has-sub"] ul li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="borders"] table:nth-child(1) tbody:nth-child(1) tr'],
      handler: postHandler,
    },
  ],
  1440,
);
