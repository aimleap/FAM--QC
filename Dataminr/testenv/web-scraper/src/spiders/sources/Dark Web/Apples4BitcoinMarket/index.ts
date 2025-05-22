import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: true,
  name: 'Apples 4 Bitcoin Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://okayd5ljzdv4gzrtiqlhtzjbflymfny2bxc2eacej3tamu2nyka7bxad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('td:nth-of-type(1)').text().trim();
    const price = $(el).find('td:nth-of-type(2)').text().trim();
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext: title,
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
      selector: ['table[class="table1"] tbody tr'],
      handler: postHandler,
    },
  ],
  1440,
);
