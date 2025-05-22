import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: 'Lorenz Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://lorenzmlwpzgxq736jzseuterytjueszsvznuibanxomlpkyxk6ksoyd.onion/',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    let timestamp: number;
    const title = $(el).find('div[class="panel-heading"] h3').text().trim();
    const text = $(el)
      .find('div[class="panel-body"]')
      .text()
      .trim()
      .replace(/[\r\t\n\s]+/g, ' ');
    const websiteLink = $(el).find('h5 a[href*="//"]').text().trim();
    let rawtime = $(el).find('div[class="panel-heading"] h3 + h5').text().trim();
    if (!rawtime.includes('Posted')) {
      rawtime = $(el).find('div[class="panel-heading"] h3 + h5 + h5').text().trim();
    }
    if (!rawtime.includes('Posted')) {
      timestamp = moment().unix();
    } else {
      const time = rawtime.replace('Posted ', '').replace('.', '');
      timestamp = moment.utc(time, 'MMM DD, YYYY').unix();
    }
    items.push(
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
            articlefulltext: text,
            victimWebsite: websiteLink,
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
      selector: ['div[class="panel panel-primary"]'],
      handler: postHandler,
    },
  ],
  1440,
);
