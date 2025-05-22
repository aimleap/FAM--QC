import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransomware',
  isCloudFlare: false,
  name: '8Base Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://xb6q2aggycmlcrjtbjendcnnwpmmwbosqaugxsqb4nx6cmod3emy7sad.onion/',
  requestOption: {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.7',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie: 'fakeIP=168.203.198.115; XSRF-TOKEN=eyJpdiI6ImtYWmowcXJtWUhTN09Tc0RnbWFCYnc9PSIsInZhbHVlIjoiaUc0T1F6a2diNzBZNEZSNmJpN3hRVkFpQXI2SnhiN2ttNDRUQ29pbk5FWDJmZ1ErUU5jY2VqSU03VkFaYzl1R1IrMlh2K05QQ0o1Z3FWblovUUhoQkROOWlQaVpnajdxL1FFQ01EcTR5NzNpRkRtcS9RU2oyYWVqc1hTNkcxUloiLCJtYWMiOiJkMmM4NzA2YWZmNzNkOGQzMDlhNDYxOGY2YWM1NWMyNzgyYTJjMGEwODIxZDBkZWJkMDc0NWJmZGMyNjE2MmVmIiwidGFnIjoiIn0%3D; 8base_session=eyJpdiI6Im10aVhDNWZ1WEppMXJhMXpVNDRzUnc9PSIsInZhbHVlIjoiY2N4N3pldHhhUXJ0RlRwQ1lrSlFPaDYzbktpNXpLSGs3eGxDVlBEczJkMkh4bHFSTlZOMVoyTzA3N1BLaXVoTk9LT2lFeHRSZDZWZGNqYXJNQSswZXVzUVhUOHE3dTVpRFU5dTJ5bk1tRkhpRDRVTE1qc0JDYWQ5WW93NlF2ZEEiLCJtYWMiOiIyNzIxMDA4MTU3YjAyNzI5NDBlNTVlOTAyZmE4MWNiM2NiZTBiZDkyNzU3YjBhMzY0ZDk4NjhkZmYxMDIwZmJmIiwidGFnIjoiIn0%3D',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Sec-GPC': '1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Brave";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const items: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('a[class="stretched-link"]').text().trim();
    const link = $(el).find('a[class="stretched-link"]').attr('href').trim();
    const articletext = $(el).find('div[class="small opacity-50"]').text().trim()
      .replace(/[\t\n\s]+/g, ' ')
      .split('Were uploaded to the servers:')[0];
    const comment = $(el).find('h4 + div[class="small opacity-50"]').text().trim();
    const time = $(el).find('div[class="d-flex gap-2 small mt-1 opacity-25"] div:nth-child(2) b').text().trim();
    const timestamp = moment.utc(time, 'DD.MM.YYYY').unix();
    const text = `${articletext}\n${title}`;
    items.push(
      new Post(
        text,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            CompanyName: title,
            articlefulltext: articletext,
            comment,
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
      selector: ['div[class="list-group-item rounded-3 py-3 bg-body-secondary text-bg-dark mb-2 position-relative"]'],
      handler: postHandler,
    },
  ],
  1440,
);
