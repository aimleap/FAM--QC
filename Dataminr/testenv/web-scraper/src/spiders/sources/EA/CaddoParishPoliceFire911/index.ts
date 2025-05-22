import moment from 'moment';
import { randomUUID } from 'crypto';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { DUMMY_SITE } from '../../../parsers/Parser';
import { getCountryProxyUrl } from '../../../../lib/proxy/sourceProxy';
import { AVAILABLE_COUNTRIES } from '../../../../lib/proxy/countries';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Caddo Parish Police and Fire',
  type: SourceTypeEnum.FORUM,
  url: DUMMY_SITE,
};

async function proxyHandler(): Promise<ThreadType[]> {
  return [
    {
      title: `caddo-parish-${randomUUID()}`,
      link: 'http://ias.ecc.caddo911.com/(X(1)S(jtyhmqtvhhyccswv44f5qqjk))/All_ActiveEvents.aspx?AspxAutoDetectCookieSupport=1',
      timestamp: moment().utc().unix(),
      parserName: 'post',
      requestOption: {
        proxy: await getCountryProxyUrl(AVAILABLE_COUNTRIES['United States']),
      },
    },
  ];
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: String[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements)
    .find('table[id="ctl00_MainContent_GV_AE_ALL_P"] tbody tr')
    .get()
    .slice(1);
  entrySelector.forEach((el) => {
    const eventType = $(el).find('td:nth-child(4)').contents().text()
      .trim();
    const crossStreets = $(el).find('td:nth-child(6)').text().trim();
    const timestamp = moment().unix();
    const time = $(el).find('td:nth-child(2)').text().trim();
    const hours = parseInt(time.substring(0, 2), 10);
    const minutes = parseInt(time.substring(2, 4), 10);
    const now = new Date();
    now.setHours(hours);
    now.setMinutes(minutes);
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const formattedTime = now.toTimeString().substr(0, 5);
    const formattedDate = `${month}/${day}/${year} ${formattedTime}:00`;
    posts.push(
      new Post(
        `Event Type: ${eventType}; DateTime: ${formattedDate}; Location: ${crossStreets}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            eventtype: eventType,
            datetime: timestamp,
            location: crossStreets,
            ingestpurpose: 'deepweb',
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
      name: 'proxy',
      selector: ['*'],
      handler: proxyHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
