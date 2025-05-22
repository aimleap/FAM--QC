import moment from 'moment';
import _ from 'lodash';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'SenSayQ ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://gmixcebhni6c3kcf5m7xxybomaphj7pizoqtxiqmrz5wsh6g6x5s2wqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title1 = $(el).find('a div[class="cls_recordTop"] p').text().trim();
    const link = $(el).find('a').attr('href');
    const domain = $(el).find('a div[class="cls_recordMiddle"] p').text().trim();
    const views = $(el).find('div[class="cls_recordBottom"] div[class="cls_recordBottomElement"]:nth-of-type(1) div').text().trim();
    const status = $(el).find('div[class="cls_recordBottom"] div[class="cls_recordBottomElement"]:nth-of-type(2) div:nth-of-type(2)').text().trim();
    const title = `${title1} ; ${domain} ; ${views} ; ${status}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url:string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="cls_content"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="cls_logo"]').text().trim();
    const articletext = $(el).find('div[class="cls_scrollingInfo"]').text().replace(/[\t\n\s]+/g, ' ')
      .trim();
    const domain = forumPaths[0].split(';')[1].trim();
    const views = forumPaths[0].split(';')[2].trim();
    const status = forumPaths[0].split(';')[3].trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}: ${domain}: ${articletext};`,
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
            status,
            views,
            leakcontents: articletext,
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
      selector: ['div[class="content-wrapper"] div[class="cls_record card"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content-wrapper"]'],
      handler: postHandler,
    },
  ],
  1440,
);
