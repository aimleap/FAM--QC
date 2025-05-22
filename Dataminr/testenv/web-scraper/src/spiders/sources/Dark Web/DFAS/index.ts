import moment from 'moment';
import _ from 'lodash';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Forum',
  isCloudFlare: false,
  name: 'DFAS',
  type: SourceTypeEnum.FORUM,
  url: 'http://dfasg4j6ebrkhjyxfff3nbp7c56ugl4zc2ml5gzkmcxvf77iodq3fsad.onion/index.php?action=recent;start=0',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link1 = $(el).find('h5 a:nth-of-type(2)').attr('href');
    if (link1) {
      const title = $(el).find('h5 a:nth-of-type(2)').text().trim();
      const link = `http://dfasg4j6ebrkhjyxfff3nbp7c56ugl4zc2ml5gzkmcxvf77iodq3fsad.onion${$(el).find('h5 a:nth-of-type(2)').attr('href')}`;
      const date = $(el).find('span[class="smalltext"] em').text().trim();
      moment.locale('fr');
      const timestamp = moment.utc(date, 'MMMM DD,YYYY hh:mm:ss A').unix();
      items.push({
        title,
        link,
        parserName: 'post',
        timestamp,
        delay: _.random(15, 30) * 1000,
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
  moment.locale('fr');
  const items: Post[] = [];
  const title = $(elements).find('div[class="navigate_section"]:nth-of-type(1) li:nth-of-type(4) a span').text().trim();
  const entrySelector = $(elements).find('div[class*="windowbg"]:last').get();
  entrySelector.forEach((el) => {
    const username = $(el).find('h4 a').text().trim();
    const textbody = $(el).find('div[class="inner"]').text().trim();
    const date = $(el).find('div[class="smalltext"]').clone().find('strong')
      .remove()
      .end()
      .text()
      .replace('»', '')
      .replace('«', '')
      .trim();
    const lastCommaIndex = date.lastIndexOf(',');
    const part1 = date.substring(0, lastCommaIndex);
    moment.locale('fr');
    const firstSpaceIndex = part1.indexOf(' ');
    const date2 = part1.substring(firstSpaceIndex + 1).trim();
    const timestamp = moment.utc(date2, 'MMMM DD,YYYY').unix();
    items.push(
      new Post(
        `${textbody}; ${date}; ${title}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            publishedDate: date2,
            username,
            articlefulltext: textbody,
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
      name: 'thread',
      selector: ['div[class="topic_details"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="bodybg"]'],
      handler: postHandler,
    },
  ],
  1440,
);
