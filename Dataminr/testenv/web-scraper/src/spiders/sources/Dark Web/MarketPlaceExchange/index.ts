import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forum Site',
  isCloudFlare: true,
  name: 'Market Place Exchange',
  type: SourceTypeEnum.FORUM,
  url: 'http://deepmixbf6xqt3m7kagmurdt4v43f2h3doc23h7hrkjlroovyjsvseqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('tr td a[class="link_index_ad"]').get();
  entrySelector.forEach((ele: any) => {
    const title = $(ele).text().trim();
    const link = $(ele).attr('href');
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
    const title = $(el).find('tr td font a:nth-of-type(3)').text().trim();
    const articlefulltext = $(el)
      .find('div[class="div_view_goods_reply"] t')
      .contents()
      .text()
      .trim();
    const time = $(el).find('div.div_goods_post_inner').text().split('  时间:')[1];
    const timestamp = moment(time, 'YYYY-MM-DD hh:mm').unix();
    items.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['table.table_ad_b tbody'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="div_page"]'],
      handler: postHandler,
    },
  ],
  1440,
);
