import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Trinity ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://txtggyng5euqkyzl2knbejwpm4rlq575jn2egqldu27osbqytrj6ruyd.onion/articles',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const company = $(el).find('p:nth-child(5)').text().split('name:')[1].trim();
    const domain = $(el).find('p:nth-child(1)').text().split('name:')[1].trim();
    const publication = $(el).find('p:nth-child(3)').text().split('time:')[1].trim();
    const revenue = $(el).find('p:nth-child(4)').text().split(':')[1].trim();
    let finalCompany = company;
    let finalDomain = domain;
    if (company.includes('www.') || company.includes('http')) {
      finalCompany = domain;
      finalDomain = company;
    }
    const text = $(el)
      .find('p:nth-child(2)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment().unix();
    items.push(
      new Post(
        `${finalCompany}; ${text}; ${publication}; ${revenue}`,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: finalCompany,
            domain: finalDomain,
            revenue,
            leakdate: publication,
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
      selector: ['div[id*="article_"]'],
      handler: postHandler,
    },
  ],
  1440,
);
