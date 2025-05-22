import moment from 'moment';
import _ from 'lodash';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forums',
  isCloudFlare: true,
  name: 'AirFleets 2',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.airfleets.net/divers/update-0.htm',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('td:nth-child(1) a').text().trim();
    const link = `https://www.airfleets.net${$(el)
      .find('td:nth-child(1) a')
      .attr('href')
      .slice(2)}`;
    const date = $(el).find('td:nth-child(5)').text().trim();
    const timestamp = moment.utc(date, 'DD/MM/YYYY').unix();
    items.push({
      title: `${title}\n${date}`,
      link,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
      timestamp,
    });
  });
  return items;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const text = $(elements).find('h1').text().trim();
  const title = text.split(' - ')[0];
  const MSN = text.split(' - ')[1].split('  ')[0].split('MSN ')[1];
  const Registration = text.split('  ')[1];
  const rowCount = $(elements).find('tbody tr').get().length;
  const aircraftType = $(elements).find('tbody tr:nth-child(2) td:nth-child(2)').text().trim();
  const engineType = $(elements)
    .find(`tbody tr:nth-child(${rowCount - 1}) td:nth-child(2)`)
    .text()
    .trim();
  const timestamp = moment().unix();
  posts.push(
    new Post(
      `${title}\n${MSN}`,
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
          MSN,
          Registration,
          aircraftType,
          engineType,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['tr[class="tabcontent"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="twelve columns"] + div[class="six columns"] div[class="boxhome"]'],
      handler: postHandler,
    },
  ],
  1440,
);
