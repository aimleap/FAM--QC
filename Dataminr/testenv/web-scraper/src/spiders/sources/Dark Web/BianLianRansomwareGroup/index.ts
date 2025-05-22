import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'BianLian Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://bianlianlbc5an4kgnay3opdemgcryg2kpfcbgczopmm3dnbz3uaunad.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = `http://bianlianlbc5an4kgnay3opdemgcryg2kpfcbgczopmm3dnbz3uaunad.onion${$(el).find('h1[class="title"] a').attr('href')}`;
    if (link1) {
      const title = $(el).find('h1[class="title"] a').text().trim();
      const link = `http://bianlianlbc5an4kgnay3opdemgcryg2kpfcbgczopmm3dnbz3uaunad.onion${$(el).find('h1[class="title"] a').attr('href')}`;
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        timestamp,
        parserName: 'post',
      });
    }
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
    const title = $(el).find('h1[class="title"]').text().trim();
    const domain = $(el).find('section[class="body"] p:nth-of-type(1) a').attr('href');
    const articlefulltext = $(el).find('section[class="body"]').clone().find('p:nth-of-type(1) a')
      .remove()
      .end()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const timestamp = moment().unix();
    posts.push(
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
            domain,
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
      selector: ['main[class="list"] section'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
