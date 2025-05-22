import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Apple World Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://applbwku7dfadkfkumiojsbxekuiafpr44idl7bxb2xll6neykvx35id.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="col-md-3"]').get();
  entrySelector.forEach((el) => {
    const htmlContent = $('div[class="caption"] p b').html();
    let title1 = '';
    let title2 = '';
    if (htmlContent !== null) {
      const textData = htmlContent.split('<br>');
      title1 = textData[0].trim();
      title2 = textData[1].trim();
    }
    const price = $(el).find('div[class="caption"] p[style] b').text().trim();
    const title3 = $(el)
      .find('div[class="caption"] p')
      .first()
      .text()
      .replace(/\n/g, ' ')
      .split('$')[0]
      .trim();
    const finaltitle = `${title1} ${title2} ${title3}`;
    const articlefulltext = `${finaltitle} ${price}`;
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
            entity: finaltitle,
            title: finaltitle,
            ProductName: finaltitle,
            price,
            articlefulltext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['div[class="container2"]'],
      handler: postHandler,
    },
  ],
  1440,
);
