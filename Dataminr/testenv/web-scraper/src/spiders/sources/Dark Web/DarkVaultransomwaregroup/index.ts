import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'DarkVault Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://mdhby62yvvg6sd5jmx5gsyucs7ynb5j45lvvdh4dsymg43puitu7tfid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="post-title-block"] div:nth-of-type(1)').text().trim();
    const link = `http://mdhby62yvvg6sd5jmx5gsyucs7ynb5j45lvvdh4dsymg43puitu7tfid.onion${$(el).attr('onclick').split("('")[1].split("')")[0]}`;
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
    const title = $(el).find('div[class="post-big-title"]').text().trim();
    const articletext = $(el).find('div[class="desc"]').contents().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const date = $(el).find('div[class="uploaded-date-utc"]').text().trim();
    const timestamp = moment.utc(date, 'DD MMMM, YYYY').unix();
    posts.push(
      new Post(
        `${title}; ${articletext}`,
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
      selector: ['div[class="post-block bad"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="post-company-info"]'],
      handler: postHandler,
    },
  ],
  1440,
);
