import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Steroid King',
  type: SourceTypeEnum.FORUM,
  url: 'http://skingykcpkkenvhhlg5vdsitvdoefkbo7frfiv3gscue66ynvuqq7bid.onion/',
};
async function paginationHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  let link = '';
  for (let i = 1; i <= 4; i++) {
    link = `http://skingykcpkkenvhhlg5vdsitvdoefkbo7frfiv3gscue66ynvuqq7bid.onion/?paged=${String(i)}`;
    items.push({
      title: '',
      link,
      parserName: 'thread',
      timestamp: moment().unix(),
    });
  }
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = $(el)
      .find(
        'a[class="woocommerce-LoopProduct-link woocommerce-loop-product__link"]',
      )
      .attr('href');
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
      const title = $(el).find('h1').text().trim();
      let price = $(el).find('p[class="price"]  ins bdi').text().trim();
      if (price === '') {
        price = $(el).find('p[class="price"] bdi').text().trim();
      }
      const category = $(el)
        .find('span[class="posted_in"]')
        .text()
        .split(':')[1]
        .trim();
      const tags = $(el)
        .find('span[class="tagged_as"]')
        .text()
        .split(':')[1]
        .trim();
      const description = $(el).find('div[id="tab-description"] p').text();
      const text = `${title}\n${price}\n${tags}`;
      const timestamp = moment().unix();

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
            entity: title,
            title,
            description,
            price,
            tags,
            category,

            ingestpurpose: 'darkweb',
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
      name: 'pagination',
      selector: ['*'],
      handler: paginationHandler,
    },
    {
      name: 'thread',
      selector: ['ul[class="products columns-3"] li'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="row rsrc-content"] '],
      handler: postHandler,
    },
  ],
  1440,
);
