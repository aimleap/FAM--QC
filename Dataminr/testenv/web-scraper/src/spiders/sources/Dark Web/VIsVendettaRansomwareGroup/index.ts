import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: true,
  name: 'V Is Vendetta Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://test.cuba4ikm4jakjgmkezytyawtdgr2xymvy6nvzgw5cglswg3si76icnqd.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a').attr('href').split('/')[2];
    const link = `http://test.cuba4ikm4jakjgmkezytyawtdgr2xymvy6nvzgw5cglswg3si76icnqd.onion${$(el)
      .find('a')
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
  forumpaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h2').contents().text()
    .trim();
  const articletext = $(elements)
    .find('div p')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const date = articletext.split('received: ')[1].split('website')[0];
  const domain = articletext.split('website: ')[1].split('files')[0];
  const files = articletext.split('files: ')[1];
  const timestamp = moment.utc(date, 'DD MMMM YYYY').unix();
  posts.push(
    new Post(
      `${articletext}\n${title}\n${files}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          domain,
          title,
          files,
          receivedDate: date,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['div[class="post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="post"]'],
      handler: postHandler,
    },
  ],
  1440,
);
