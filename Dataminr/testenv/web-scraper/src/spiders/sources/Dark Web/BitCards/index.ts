import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking Forums',
  isCloudFlare: false,
  name: 'Bit Cards',
  type: SourceTypeEnum.FORUM,
  url: 'http://bitcc24twqhkzkqhjs6kwvsxkrvkxlvb46cm45ff67dyxnp3fkr6xqqd.onion/list.php',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((ele) => {
    let mainTitle = $(ele).find('h4').text().trim();
    if (mainTitle === '') {
      mainTitle = 'Visa Prepaid Cards';
    }
    const entrySelector = $(ele).find('div[class="col-md-3"]').get();
    entrySelector.forEach((el) => {
      const title = `${mainTitle}: ${$(el).find('h3').text().trim()}`;
      const balance = $(el).find('tbody tr:nth-child(1) td:nth-child(2)').text().trim();
      const withdrawLimit = $(el).find('tbody tr:nth-child(2) td:nth-child(2)').text().trim();
      const articletext = `${balance}, ${withdrawLimit}`;
      const timestamp = moment().unix();
      posts.push(new Post(
        `${title}\n${balance}`,
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
            balance,
            withdrawLimit,
            articlefulltext: articletext,
            ingestpurpose: 'darkweb',
            parse_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ));
    });
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="row"]'],
      handler: postHandler,
    },
  ],
  1440,
);
