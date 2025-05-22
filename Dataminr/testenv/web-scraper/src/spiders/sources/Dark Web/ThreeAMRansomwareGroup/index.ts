import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'ThreeAM Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="post-title-block"] div:nth-of-type(1)').text().trim();
    const link = `http://threeamkelxicjsaf2czjyz2lc4q3ngqkxhhlexyfcp2o6raw4rphyad.onion/${$(el)
      .find('a[class="post-more-link f_left"]')
      .attr('onclick')
      .split('uri=')[1]
      .replace("html'", 'html')
      .trim()}`;
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
    const title = $(el).find('h4').text().trim();
    const published = $(el)
      .find('div[class="meter noselect"] span')
      .text()
      .replace('PUBLISHED', '')
      .trim();
    const articletext = $(el)
      .find('div[class="full-bord"] p')
      .contents()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    const date = $(el).find('span[class="meta_full noselect f_left"]').text().trim();
    const timestamp = moment.utc(date, 'DD/MM/YYYY').unix();
    posts.push(
      new Post(
        `${articletext}\n${title}`,
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
            articletext,
            published,
            date,
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
      selector: ['div[class="post-list"] div[class="post bad"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="container-fluid bord"]'],
      handler: postHandler,
    },
  ],
  1440,
);
