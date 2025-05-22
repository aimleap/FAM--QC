import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Ransomexx',
  type: SourceTypeEnum.FORUM,
  url: 'http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2 a').text();
    const link = `http://rnsm777cdsjrsdlbs4v5qoeppu3px6sb2igmh53jzrx7ipcrbjz5b2ad.onion${$(el)
      .find('h2 a')
      .attr('href')
      .slice(1)}`;
    const time = $(el).find('time[class="entry-date published"]').attr('datetime');
    const timestamp = moment(time).unix();
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
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const articlefulltext = $el
      .find('div[class="entry-content"]')
      .contents()
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const title = $el.find('h1').text().trim();
    const time = $(el).find('time[class="entry-date published"]').attr('datetime');
    const timestamp = moment(time).unix();
    posts.push(
      new Post(
        articlefulltext,
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
      name: 'thread',
      selector: ['div[class="inside-article"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content-area"]'],
      handler: postHandler,
    },
  ],
  1440,
);
