import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Babuk Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://nq4zyac4ukl4tykmidbzgdlvaboqeqsemkp4t35bzvjeve6zm2lqcjid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://nq4zyac4ukl4tykmidbzgdlvaboqeqsemkp4t35bzvjeve6zm2lqcjid.onion${$(el)
      .find('a')
      .attr('href')}`;
    const title = $(el).find('h5').text().trim();
    const time = $(el).find('div[class="col-auto published"]').text().trim();
    const timestamp = moment.utc(time, 'YYYY-MM-DD hh:mm:ss A').unix();
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
    const title = $(el).find('h1[class="align-middle d-inline-block mb-0"]').text().trim();
    const timestamp = moment().unix();
    const views = $(el).find('p[class="text-muted mb-5"]').text().trim()
      .replace('views: ', '');
    const articlefulltext = $(el)
      .find('div[class="container py-5 content-info"] p')
      .contents()
      .text()
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
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
            views,
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
      selector: ['div[class="col-lg-4 col-sm-6 mb-4"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
