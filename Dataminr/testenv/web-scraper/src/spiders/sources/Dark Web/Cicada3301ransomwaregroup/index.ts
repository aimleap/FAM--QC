import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware Leaks',
  isCloudFlare: false,
  name: 'Cicada3301 ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://cicadabv7vicyvgz5khl7v2x5yygcgow7ryy6yppwmxii4eoobdaztqd.onion/',
  requestOption: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const domain = $(el).find('a[class="text-blue-400 text-sm ml-1 hover:text-blue-300"]').text().trim();
    const datasize = $(el).find('div[class="max-w-md pr-10"] div[class="rounded-md inline-block mb-1"]:nth-child(3) span[class="text-white text-sm ml-1"]').text().trim();
    const leakdate = $(el).find('div[class="max-w-md pr-10"] div[class="rounded-md inline-block mb-1"]:nth-child(5) span[class="text-white text-sm ml-1"]').text().trim();
    const description = $(el).find('p[class="p-2 mt-1 text-gray-400 text-mg mb-6 overflow-y-auto whitespace-pre-wrap border border-gray-700 rounded-lg"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ');
    const timestamp = moment(leakdate, 'MMMM DD, YYYY').unix();
    items.push(
      new Post(
        `${title}; Web: ${domain}; Description: ${description}; Publication date: ${leakdate}; Size Data: ${datasize}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            domain,
            leakdate,
            datasize,
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
      selector: ['div[class="flex flex-wrap -mx-6"] div[class="w-full sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/3 px-6 mb-12"]'],
      handler: postHandler,
    },
  ],
  1440,
);
