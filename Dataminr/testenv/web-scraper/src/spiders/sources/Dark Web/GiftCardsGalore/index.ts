import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import Post from '../../../../schema/post';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'Gift Cards Galore',
  type: SourceTypeEnum.FORUM,
  url: 'http://dbvjicoy4yvzavh5uijfjqjbbs6nv54lwmhqqqnka2o3yd4ena2cylyd.onion/',

};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const text1 = $(el).find('h4').text().trim();
    const text2 = $(el).find('p:first').text().trim();
    const price = $(el).find('p:nth-of-type(2)').text().split('Payment')[0].replace('Our Price:', '').trim();
    const imageurl = `http://dbvjicoy4yvzavh5uijfjqjbbs6nv54lwmhqqqnka2o3yd4ena2cylyd.onion/${$(el).find('img').attr('src')}`;
    const articlefulltext = `${text1} ${text2}`;
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${title}\n${articlefulltext}\n${price}`,
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
            articlefulltext,
            price,
            imageurl,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="w3-card w3-white"]'],
      handler: postHandler,
    },
  ],
  1440,
);
