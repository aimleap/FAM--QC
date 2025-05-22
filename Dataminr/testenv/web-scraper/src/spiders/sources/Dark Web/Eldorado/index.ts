import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Eldorado',
  type: SourceTypeEnum.FORUM,
  url: 'http://ulvd4nqndu6vpc62nxho24vl7cnvfmf4crcdmoeeztq2hqnwbesfjjad.onion/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('section[data-id="6433078"] div[class*="elementor-column elementor-col-33"]').get();
  entrySelector.forEach((el: any) => {
    const balance = $(el).find('h3 span p').text().trim()
      .split(' ')[1];
    const title = `${$(el).find('h3 span').text().trim()
      .replace(balance, '')} ${balance}`;
    const price = $(el).find('span[class="elementor-button-text"]').text().trim()
      .split('BUY FOR ')[1];
    const articlefulltext = $(el).find('p[class="elementor-icon-box-description"]').text().trim()
      .replace(/[\r\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    posts.push(new Post(
      `${title}\n${price}`,
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
          balance,
          price,
          articlefulltext,
          ingestpurpose: 'darkweb',
          parse_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ));
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
