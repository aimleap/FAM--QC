import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'New Security Bulletins and Briefs',
  isCloudFlare: true,
  name: 'Apple',
  type: SourceTypeEnum.FORUM,
  url: 'https://support.apple.com/en-us/HT201222',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const items: Post[] = [];
  const entrySelector = $(elements).find('tr').get().slice(1);
  entrySelector.forEach((el) => {
    let title = $(el).find('td:nth-of-type(1) a').text().trim();
    let link = $(el).find('td:nth-of-type(1) a').attr('href');
    if (!link) {
      title = $(el).find('td:nth-of-type(1)').text().split('\n')[0].trim();
      link = 'https://support.apple.com/en-us/HT201222';
    }
    const affectedProducts = $(el).find('td:nth-of-type(2)').text().trim();
    const releaseDate = $(el).find('td:nth-of-type(3)').text().trim();
    const timestamp = moment.utc(releaseDate, 'DD MMM YYYY').unix();
    items.push(
      new Post(
        `${title};${affectedProducts};${releaseDate}`,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            AffectedProducts: affectedProducts,
            ReleasedDate: releaseDate,
            PublishedDate: '',
            Cves: '',
            ingestpurpose: 'deepweb',
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
      selector: ['div[id="tableWraper"] tbody'],
      handler: postHandler,
    },
  ],
  1440,
);
