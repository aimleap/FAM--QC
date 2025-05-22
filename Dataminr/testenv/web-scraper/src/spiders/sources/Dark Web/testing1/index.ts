import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: '7up Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://weud6joun7qvhhjwrdufsdoyzcc4bnf3aoyuchprzy333ogbt4ohn4ad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="product-card__title"]').text().trim();
    const link = `http://weud6joun7qvhhjwrdufsdoyzcc4bnf3aoyuchprzy333ogbt4ohn4ad.onion/${$(el).find('a[class="product-card__title"]').attr('href')}`;
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
  const articletext = $(elements).find('div[class="text-xl"] p').text().trim();
  const title = $(elements).find('h1').text().trim();
  const price = $(elements).find('span[class="product-price__val"]').text().trim();
  const timestamp = moment().unix();
  const text = `${articletext}\n${title}`;
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
          articlefulltext: articletext,
          price,
          CompanyName: title,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="col-12 col-sm-6 col-md-4 col-lg-3"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="row justify-content-center"]'],
      handler: postHandler,
    },
  ],
  1440,
);
