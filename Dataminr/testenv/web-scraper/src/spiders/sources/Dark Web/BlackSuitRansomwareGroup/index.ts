import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leak Website',
  isCloudFlare: false,
  name: 'BlackSuit Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el)
      .find('div[class="title"] a')
      .text()
      .split('$')[0]
      .replace(/\b(?:0?[1-9]|[12][0-9]|3[01])[-/](?:0?[1-9]|1[0-2])[-/](?:\d{2}|\d{4})\b/g, '')
      .trim();

    if (title) {
      const link = `http://weg7sdx54bevnvulapqu6bpzwztryeflq3s23tegbmnhkbpqz637f2yd.onion/${$(
        el,
      )
        .find('div[class="title"] a')
        .attr('href')}`;
      const timestamp = moment().unix();
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
      });
    }
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
  const items: Post[] = [];
  elements.forEach((element) => {
    const title = $(element)
      .find('div[class="title"]')
      .text()
      .split('$')[0]
      .replace(/\b(?:0?[1-9]|[12][0-9]|3[01])[-/](?:0?[1-9]|1[0-2])[-/](?:\d{2}|\d{4})\b/g, '')
      .trim();
    if (title) {
      const websitetext = $(element).find('div[class="url"] a').text().trim();
      const domain = $(element).find('div[class="url"] a').attr('href');
      const timestamp = moment().unix();
      const description1 = $(element)
        .find('div[class="text"]')
        .contents()
        .text()
        .trim();
      const description2 = $(element).find('div[class="links"]').text().trim();
      const finaldescription = `${description1} ${description2}`;
      items.push(
        new Post(
          `${title}\n${websitetext}\n${description1}`,
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              entity: title,
              description: finaldescription,
              domain,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });

  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="card"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="card"]'],
      handler: postHandler,
    },
  ],
  1440,
);
