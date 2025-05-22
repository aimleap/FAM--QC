import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'CryptNet Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://blog6zw62uijolee7e6aqqnqaszs3ckr5iphzdzsazgrpvtqtjwqryid.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2[class="h2-trial-decrypt welcome-header"]').text();
    const link = `http://blog6zw62uijolee7e6aqqnqaszs3ckr5iphzdzsazgrpvtqtjwqryid.onion${$(el)
      .find('a[class="blog-more-info"]')
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
  const title = $(elements).find('h2').text().trim();
  const domain = $(elements).find('h3').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="head-info-body blog-head-info-body"]')
    .contents()
    .text()
    .replace(/[\t\n\s]+/g, ' ');
  const timestamp = moment().unix();
  const text = `${articlefulltext}\n${title}`;
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
          CompanyName: title,
          domain,
          articlefulltext,
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
      selector: ['div[class="col-6 d-flex justify-content-end position-relative blog-div"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="row"]'],
      handler: postHandler,
    },
  ],
  1440,
);
