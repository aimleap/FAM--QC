import moment from 'moment';
import { Response } from 'request';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Forum site',
  isCloudFlare: false,
  name: 'Probiv Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://runionv3do7jdylpx7ufc6qkmygehsiuichjcstpj4hb2ycqrnmp67ad.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements)
    .find('div[class="p-0 card-body"]')
    .get()
    .slice(0, 5);
  entrySelector.forEach((el) => {
    const entrySelector2 = $(el).find('div[class*="row"]').get();
    entrySelector2.forEach((el1) => {
      const link1 = $(el1)
        .find('a[class="forum-last-post-timestamp"]')
        .attr('href');
      if (link1) {
        const title = $(el1).find('a[class*="forum-name"]').text().trim();
        const link = `http://runionv3do7jdylpx7ufc6qkmygehsiuichjcstpj4hb2ycqrnmp67ad.onion${
          $(el1).find('a[class="forum-last-post-timestamp"]').attr('href')}`;
        const date = $(el1)
          .find('a[class="forum-last-post-timestamp"] small')
          .text()
          .split(' ')[0]
          .trim();
        const timestamp = moment.utc(date, 'YYYY/MM/DD').unix();
        items.push({
          title,
          link,
          timestamp,
          parserName: 'post',
        });
      }
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
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id1 = finalRedirectedUrl.split('#')[1];
  const title = $(elements)
    .find('ol[class="breadcrumb"] li:nth-of-type(4) a')
    .text()
    .trim();
  const forum = $(elements)
    .find('ol[class="breadcrumb"] li:nth-of-type(2) a')
    .text()
    .trim();
  const subforum = $(elements)
    .find('ol[class="breadcrumb"] li:nth-of-type(3) a')
    .text()
    .trim();
  const entrySelector = $(elements).find(`div[id=${id1}]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('div[class="username"] a b').text().trim();
    const articlefulltext = $(el)
      .find('div[class="post-content"]')
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const text = $(el)
      .find('div[class="post-content"]')
      .text()
      .replace(/(https?|http):\/\/[^\s]+/g, '')
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
    const date = $(el)
      .find('p small')
      .clone()
      .find('a')
      .remove()
      .end()
      .text()
      .trim()
      .split(' ')[3]
      .trim();
    const timestamp = moment.utc(date, 'YYYY/MM/DD').unix();
    posts.push(
      new Post(
        `${text}\n${title}`,
        {
          current_url: finalRedirectedUrl,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            forum,
            subforum,
            articlefulltext,
            username,
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
      selector: ['div[id="wrap"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="wrap"]'],
      handler: postHandler,
    },
  ],
  1440,
);
