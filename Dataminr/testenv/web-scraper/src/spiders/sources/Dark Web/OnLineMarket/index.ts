import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Market',
  isCloudFlare: false,
  name: 'On-Line Market',
  type: SourceTypeEnum.FORUM,
  url: 'http://deeyb4ewqghsujbqokcimlfs6646fcmf3yjiw4qv4qzhpirh26q2wcyd.onion/',
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
    let title = '';
    const featuresContent = $('.features-content').html();
    if (featuresContent) {
      const commentRegex = /<!--([\s\S]*?)-->/;
      const match = commentRegex.exec(featuresContent);
      title = match ? match[1].trim().replace(/<[^>]*>/g, '') : '';
    } else {
      title = '';
    }
    const entrySelector = $(el).find('p').get();
    entrySelector.forEach((ele) => {
      const articletext = $(ele).text().trim();
      const price = $(ele).find('a').text().split(' ')[1];
      const timestamp = moment().unix();
      if (articletext === null) {
        return;
      }
      items.push(
        new Post(
          articletext,
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
              articletext,
              price,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    });
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="col-md-4"]'],
      handler: postHandler,
    },
  ],
  1440,
);
