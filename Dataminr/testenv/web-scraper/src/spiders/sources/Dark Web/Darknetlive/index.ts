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
  description: 'Other',
  isCloudFlare: false,
  name: 'Darknetlive',
  type: SourceTypeEnum.FORUM,
  url: 'http://darknetlidvrsli6iso7my54rjayjursyw637aypb6qambkoepmyq2yd.onion/',
};
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h3').text().trim();
    const link = `http://darknetlidvrsli6iso7my54rjayjursyw637aypb6qambkoepmyq2yd.onion${$(
      el,
    ).attr('href')}`;
    const time = $(el)
      .find('div:nth-child(2) div[class="note"]:nth-child(2)')
      .text()
      .split(' ')[2]
      .trim();
    const timestamp = moment.utc(time, 'YYYY-MM-DD').unix();
    items.push({
      title,
      link,
      parserName: 'post',
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
  const items: Post[] = [];
  const title = $('h1').text().trim();
  const text = $('div[class="bbcode"]').text().trim();
  const comment = $(elements).find('h2[id="comments"]').text().trim();
  const time = $(elements).find(' div[class="note mt-2"]').text().split(' ')[6];
  const timestamp = moment.utc(time, 'YYYY-MM-DD,').unix();
  items.push(
    new Post(
      title,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          title,
          articlefulltext: text,
          comments: comment,
          ingestpurpose: 'darkweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return items;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['a[class="post"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['main'],
      handler: postHandler,
    },
  ],
  1440,
);
