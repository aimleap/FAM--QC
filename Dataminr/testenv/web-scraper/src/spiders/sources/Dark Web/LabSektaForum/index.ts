import AuthParser from '../../../parsers/AuthParser';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'LabSekta Forum',
  type: SourceTypeEnum.FORUM,
  url: 'http://bpynhpfpdydv6axdm2xeu6y6cbzed73aztxdjyq5gygblzt6v2zjegid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('div[class="node-body"]').get();
  entrySelector.forEach((el) => {
    const link1 = $(el)
      .find('div[class="node-extra-row"] a[class="node-extra-title"]')
      .attr('href');
    if (link1) {
      const link = `http://bpynhpfpdydv6axdm2xeu6y6cbzed73aztxdjyq5gygblzt6v2zjegid.onion${
        link1}`;
      const title = $(el).find('h3[class="node-title"]').text().trim();
      const timestamp = Number($(el).find('time').attr('data-time'));
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
  response: any,
): Promise<Post[]> {
  const posts: Post[] = [];
  const finalRedirectedUrl = response.request.href;
  const id = finalRedirectedUrl.split('#')[1];
  const title = $(elements).find('h1[class="p-title-value"]').text().trim();
  const forum = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-of-type(1) a')
    .text()
    .trim();
  const subforum = $(elements)
    .find('ul[class="p-breadcrumbs "] li:nth-of-type(2) a')
    .text()
    .trim();
  const entrySelector = $(elements).find(`article[data-content="${id}"]`).get();
  entrySelector.forEach((el) => {
    const postnumber1 = $(el)
      .find(
        'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(2) a',
      )
      .text()
      .trim();
    if (postnumber1) {
      const username = $(el).find('span[itemprop="name"]').text().trim();
      const articlefulltext = $(el)
        .find('div[class="bbWrapper"]')
        .contents()
        .text()
        .trim();
      const text = articlefulltext
        .replace(/(https?|http):\/\/[^\s]+/g, '')
        .replace(/(\r\n|\n|\r)/gm, '')
        .trim();
      const postnumber = $(el)
        .find(
          'ul[class="message-attribution-opposite message-attribution-opposite--list "] li:nth-of-type(2) a',
        )
        .text()
        .trim();
      const timestamp = Number($(el).find('time').attr('data-time'));
      const date = $(el).find('time').text().trim();
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
              postnumber,
              date,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="p-body"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="p-body"]'],
      handler: postHandler,
    },
  ],
  1440,
);
