import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Monti Ransomware Group 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid.onion/',
  expireIn: 200,
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h5').text();
    const link = `http://mblogci3rudehaagbryjznltdp33ojwzkq6hn2pckvjq33rycmzczpid.onion${$(
      el,
    )
      .find('a')
      .attr('href')}`;
    const time = $(el).find('div[class="col-auto published"]').text();
    const timestamp = moment.utc(time, 'YYYY-MM-DD hh:mm:ss').unix();
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
  const title = $(elements).find('div[class="py-3"] h1').text().trim();
  const parenttext = $(elements).find('div[class="col mx-auto"]');
  parenttext.find('.text-muted.mb-5').remove();
  const text = parenttext.text().split(' ');
  let description = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i].trim() !== '') {
      if (text[i].includes('http')) {
        description += '';
      } else {
        description = `${description} ${text[i].trim()}`;
      }
    } else {
      description += '';
    }
  }
  if (title.includes('project sold')) {
    return [];
  }
  const timestamp = moment().unix();
  posts.push(
    new Post(
      title,
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
          articlefulltext: description,
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
      selector: ['div[class="col-lg-4 col-sm-6 mb-4"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
