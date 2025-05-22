import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Black Market',
  isCloudFlare: false,
  name: 'Plastic Sharks',
  type: SourceTypeEnum.FORUM,
  url: 'http://rns3bsawx3xoexelkbk2kyiv6uxyklbjvxsh6joglxebftfuzxz2fryd.onion/cards',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('tbody tr').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('td:nth-of-type(1)').text().trim();
    const kind = $(el).find('td:nth-of-type(2)').text().trim();
    const information = $(el).find('td:nth-of-type(3)').text().trim();
    const estimatedvalue = $(el).find('td:nth-of-type(4)').text().trim();
    const cost = $(el).find('td:nth-of-type(5)').text().trim();
    const articlefulltext = `${title}\n${kind}\n${information}\n${estimatedvalue}\n${cost}`;
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}`,
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
            kind,
            information,
            estimatedvalue,
            cost,
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
      name: 'post',
      selector: ['table[class="table"]'],
      handler: postHandler,
    },
  ],
  1440,
);
