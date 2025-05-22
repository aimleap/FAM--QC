import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Quantum Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://quantum445bh3gzuyilxdzs5xdepf3b7lkcupswvkryf3n7hgzpxebid.onion/',
  expireIn: 200,
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const link = `http://quantum445bh3gzuyilxdzs5xdepf3b7lkcupswvkryf3n7hgzpxebid.onion${$(el)
      .find('a[class="btn btn-info"]')
      .attr('href')}`;
    const time = $(el).find('p[class*="date"]').text().trim();
    const timestamp = moment.utc(time, 'YYYY-MM-DD').unix();
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
  forumpaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const companyName = $(elements).find('dd:nth-of-type(1)').text().trim();
  const domain = $(elements).find('dd:nth-of-type(2) a').attr('href');
  const totalRevenue = $(elements).find('dd:nth-of-type(3)').text().trim();
  const lastUpdated = $(elements).find('dd:nth-of-type(4)').text().trim();
  const volume = $(elements).find('dd:nth-of-type(5)').text().trim();
  const articletext = $(elements)
    .find('div[class="col-md-4"] p')
    .text()
    .trim()
    .replace(/(\r\n|\n|\r|\t)/gm, '');
  const datasize = $(elements).find('span[class*="warning"]').text().trim();
  const date = $(elements).find('p[class*="date"]').text().trim();
  const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
  posts.push(
    new Post(
      `${articletext}\n${companyName}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: companyName,
          domain,
          title: companyName,
          companyName,
          totalRevenue,
          lastUpdated,
          VolumeOfData: volume,
          datasize,
          articlefulltext: articletext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['section[class="blog-post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div section[class="blog-post"]:first-child'],
      handler: postHandler,
    },
  ],
  1440,
);
