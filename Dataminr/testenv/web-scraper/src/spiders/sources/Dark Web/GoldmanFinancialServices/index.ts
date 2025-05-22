import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Carding Marketplace',
  isCloudFlare: false,
  name: 'Goldman Financial Services',
  type: SourceTypeEnum.FORUM,
  url: 'http://goldm6qrdsaw6jk6bixvhsikhpydthdcy7arwailr6yjuakqa6m7hsid.onion/',
};
async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((ele) => {
    const title = $(ele).find('h2[class="lg-title"]').text().trim();
    const updatedon = $(ele).find(' h4[class="lg-subtitle"]').text().split(':')[1];
    const entrySelector = $(ele).find('div[class="col-sm-4"]').get();
    entrySelector.forEach((el) => {
      const description = $(el).find('ul li:not(:first-child)').text();
      const balance = $(el).find('ul li[class="balance"]').text().trim();
      const price = $(el).find('h2').text().trim();
      const timestamp = moment().unix();
      items.push(
        new Post(
          title,
          {
            current_url: source.url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              title,
              articlefulltext: description,
              price,
              balance,
              updatedDate: updatedon,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="section-xlg"] div[class="container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
