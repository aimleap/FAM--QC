import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: false,
  name: 'Best Carding World',
  type: SourceTypeEnum.FORUM,
  url: 'http://bestteermb42clir6ux7xm76d4jjodh3fpahjqgbddbmfrgp4skg2wqd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements).find('li[class="row"]').get();
  entrySelector.forEach((el) => {
    const link1 = $(el).find('a[class="lastsubject"]').attr('href');
    if (link1) {
      const link = `http://bestteermb42clir6ux7xm76d4jjodh3fpahjqgbddbmfrgp4skg2wqd.onion${$(el).find('a[class="lastsubject"]').attr('href').replace('./', '/')}`;
      const title = $(el).find('a[class="forumtitle"]').text().trim();
      const date = ($(el).find('span:first').clone().find('a')
        .remove()
        .end()
        .text()
        .split('by')[1]).trim();
      const timestamp = moment.utc(date, 'ddd MMM D, YYYY h:mm a').unix();
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
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
  const title = $(elements).find('h2[class="topic-title"] a').text().trim();
  const forum = $(elements).find('ul[id="nav-breadcrumbs"] span:nth-child(2) a span').text().trim();
  const subforum = $(elements).find('ul[id="nav-breadcrumbs"] span:nth-child(3) a span').text().trim();
  const entrySelector = $(elements).find(`div[id="${id}"]`).get();
  entrySelector.forEach((el) => {
    const username = $(el).find('strong a[class*="username"]').text().trim();
    const articlefulltext = $(el).find('div[class="content"]').contents().text()
      .trim();
    const text = articlefulltext.replace(/(https?|http):\/\/[^\s]+/g, '').replace(/(\r\n|\n|\r)/gm, '').trim();
    const date = $(el).find('p[class="author"]').clone().find('span')
      .remove()
      .end()
      .text();
    const timestamp = moment.utc(date, 'ddd MMM D, YYYY h:mm a').unix();
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
      selector: ['div[id="page-body"]'],
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
