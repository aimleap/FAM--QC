import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'AnonBlogs',
  type: SourceTypeEnum.FORUM,
  url: 'http://anonblogd4pcarck2ff6qlseyawjljaatp6wjq6rqpet2wfuoom42kyd.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="posts"] div[class="post-link"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('a[class="title"]').text().trim();
    const link = $(el).find('a[class="title"]').attr('href');
    const username = $(el).find('a[class="username"]').text().trim();
    const time = $(el).find('span[class="date"]').text().trim();
    const timestamp = parseRelativeTimestamp(time);
    const articlefulltext = $(el).find('div[class="summary"]').text().trim();
    const tags = $(el).find('a[class="tag-link me-2"]').text().trim();
    posts.push(new Post(
      `${articlefulltext}\n${title}\n${tags}`,
      {
        current_url: link,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          username,
          tags,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
