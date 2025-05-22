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
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'RA Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://raworldw32b2qxevn3gp63pvibgixr4v75z62etlptg3u3pmajwra4ad.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).text();
    const link = `http://raworldw32b2qxevn3gp63pvibgixr4v75z62etlptg3u3pmajwra4ad.onion${$(
      el,
    )
      .attr('href')
      .slice(1)}`;
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
  const title = $(elements).find('h3').text().trim();
  const CompanyName = $(elements)
    .find('div[class="portfolio-content"] h5:nth-of-type(1) + div')
    .text()
    .trim();
  const domain = $(elements)
    .find('div[class="portfolio-content"] h5:nth-of-type(2) + div a')
    .text()
    .trim();
  let size = $(elements)
    .find('div[class="portfolio-content"] h5:nth-of-type(3) + div')
    .text()
    .trim();
  let articlefulltext = $(elements)
    .find('div[class="portfolio-content"] h5:nth-of-type(4) + div')
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  if (size.length > 10) {
    size = '';
    articlefulltext = $(elements)
      .find('div[class="portfolio-content"] h5:nth-of-type(3) + div')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
  }
  const timestamp = moment().unix();
  const text = `${articlefulltext}\n${CompanyName}`;
  posts.push(
    new Post(
      text,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: CompanyName,
          domain,
          title,
          CompanyName,
          size,
          articlefulltext,
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
      selector: ['div[class="portfolio-content"] a'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="victim"]'],
      handler: postHandler,
    },
  ],
  1440,
);
