import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'QF Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://izfefywxx4pirgexwmtp4ckibum7htanmzmnssw4upm6lbrknzyaodid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const articlefulltext = $(el)
      .find('p')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const price = articlefulltext.split('Price: ')[1].split(' ')[0];
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${articlefulltext}\n${title}`,
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
            price,
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
      selector: ['div[class="box"] div[class="inner"]'],
      handler: postHandler,
    },
  ],
  1440,
);
