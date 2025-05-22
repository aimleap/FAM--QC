import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Web',
  isCloudFlare: false,
  name: 'Arvin Club Ransomware Group 3',
  type: SourceTypeEnum.FORUM,
  url: 'http://arvinc7prj6ln5wpd6yydfqulsyepoc7aowngpznbn3lrap2aib6teid.onion/',
  expireIn: 200,
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const date = $(el).find('time').text().trim();
    const articlefulltext = $(el)
      .find('+ div[class="post-content markdown-body"]')
      .contents()
      .text()
      .split('Files Download Address')[0]
      .trim();
    const name = $(el)
      .find(
        '+ div[class="post-content markdown-body"] div[class="highlight"]:nth-of-type(1) span span',
      )
      .text()
      .trim();
    const website = $(el)
      .find(
        '+ div[class="post-content markdown-body"] div[class="highlight"]:nth-of-type(2) span span',
      )
      .text()
      .trim();
    const timestamp = moment.utc(date, 'DMMM').unix();
    posts.push(
      new Post(
        `${name}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: name,
            name,
            date,
            articlefulltext,
            website,
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
      name: 'post',
      selector: ['article[id="article"] header[class="post-header"]'],
      handler: postHandler,
    },
  ],
  1440,
);
