import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Ransoware Leaks Site',
  isCloudFlare: true,
  name: 'Dan0n ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://2c7nd54guzi6xhjyqrj5kdkrq2ngm2u3e6oy4nfhn3wm3r54ul2utiqd.onion',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h6[class="card-title"]').text().trim();
    const link = `${source.url}${$(el).find('a').attr('href')}`;
    const time = $(el).find('p[class="card-text h6"]').text().trim();
    const timestamp = moment.utc(time, 'MMM DD, YYYY').unix();
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
  const title = $(elements)
    .find('div[class="card-body space"] h2:nth-child(1)')
    .text()
    .trim();
  const articlefulltext = $(elements)
    .find('div[class="card content"]:nth-of-type(3) p')
    .text()
    .trim();
  const country = $(elements)
    .find('p[class="attrs"]:nth-child(1) span')
    .text()
    .trim();
  const website = $(elements)
    .find('p[class="attrs"]:nth-child(2) span')
    .text()
    .trim();
  const revenue = $(elements)
    .find('p[class="attrs"]:nth-child(3) span')
    .text()
    .trim();
  const industry = $(elements)
    .find('p[class="attrs"]:nth-child(4) span')
    .text()
    .trim();
  const deadline = $(elements)
    .find('h4[id="main-timer"]')
    .attr('data-deadline');
  const text = `${country};${website};${revenue};${industry};${articlefulltext}`;
  const timestamp = moment.utc(deadline, 'MMM DD, YYYY hh:mm:ss').unix();
  posts.push(
    new Post(
      `${title};${text}`,
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
          deadline,
          country,
          domain: website,
          industry,
          revenue,
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
      selector: ['div[class="card mb-3"]'],
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
