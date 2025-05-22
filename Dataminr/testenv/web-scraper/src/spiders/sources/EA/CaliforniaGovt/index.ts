import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import crypto from 'crypto';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Breach Portal',
  isCloudFlare: false,
  name: 'California Government',
  requestOption: {
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  },
  type: SourceTypeEnum.FORUM,
  url: 'https://oag.ca.gov/privacy/databreach/list',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('td[class="views-field views-field-field-sb24-org-name"] a')
      .text();
    const link = $(el)
      .find('td[class="views-field views-field-field-sb24-org-name"] a')
      .attr('href');
    const date = $(el)
      .find('td[class="views-field views-field-created active"]')
      .text();
    const timestamp = adjustTimezone(
      moment.utc(date, 'MM/DD/YYYY').format('YYYY-MM-DD hh:mm A'),
      TIME_ZONE['America/Los_Angeles'],
    );
    posts.push(
      new Post(
        title,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            ingestpurpose: 'mdsbackup',
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
      selector: ['table tbody tr'],
      handler: postHandler,
    },
  ],
  1440,
);
