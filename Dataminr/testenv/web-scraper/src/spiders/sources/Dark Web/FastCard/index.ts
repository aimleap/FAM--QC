import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Fast Card',
  type: SourceTypeEnum.FORUM,
  url: 'http://2jmbmcflllt72eqhu553bibzho7rigxhqreqstef6zg2iqrv3cj2aaid.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const articlefulltext = $(el).find('p').contents().text()
      .trim();
    const title = $(el)
      .find('div[class="item__titles text-center col-md-8"]')
      .text()
      .trim();
    const price = $(el)
      .find('input[class="btn blink_text btn-theme"]')
      .attr('value')
      .split('for ')[1];
    const category = $(el)
      .find('div[class="item__sections text-center col-md-4"]')
      .text()
      .trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        `${title}\n${price}\n${category}`,
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
            category,
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
      selector: ['div[class="col-md-4 item js-card sale-box-item"]'],
      handler: postHandler,
    },
  ],
  1440,
);
