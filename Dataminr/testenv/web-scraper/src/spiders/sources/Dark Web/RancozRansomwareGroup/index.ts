import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Rancoz Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://ze677xuzard4lx4iul2yzf5ks4gqqzoulgj5u4n5n4bbbsxjbfr7eayd.onion',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const company = $el.find('td:nth-child(1)').text().trim();
    const leaked = $el.find('td:nth-child(2)').text().trim();
    const tags = $el.find('td:nth-child(3)').text().trim();
    const datasize = $el.find('td:nth-child(4)').text().trim();
    const date = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = moment.utc(date, 'YYYY-MM-DD').unix();
    posts.push(
      new Post(
        `${company}\n${leaked}$\n${tags}\n${datasize}\n${date}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: company,
            companyName: company,
            Leaked: leaked,
            Tags: tags,
            TotalDataSize: datasize,
            LastUpdated: date,
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
      selector: ['tr[class="trow"]'],
      handler: postHandler,
    },
  ],
  1440,
);
