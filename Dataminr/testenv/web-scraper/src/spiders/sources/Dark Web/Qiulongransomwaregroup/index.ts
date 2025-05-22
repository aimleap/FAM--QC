import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Ransoware Leaks Site',
  isCloudFlare: false,
  name: 'Qiulong ransomware group ',
  type: SourceTypeEnum.FORUM,
  url: 'http://62brsjf2w77ihz5paods33cdgqnon54gjns5nmag3hmqv6fcwamtkmad.onion/',
};
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h1 a').text();
    const link = $(el).find('h1 a').attr('href');
    const articlefulltext = $(el)
      .find('div[class="entry-content"] p')
      .text()
      .trim();
    const dataSizeElement = $(el).find(
      "div.entry-content p:contains('Data volume: ')",
    );

    const datasize = dataSizeElement.length > 0
      ? dataSizeElement.text().split(': ')[1].trim()
      : $(el).find("div.entry-content p:contains('DATA SIZE: ')").text().split(':')[1];

    const time = $(el)
      .find('span[class="posted-on"]  a time:nth-child(1)')
      .attr('datetime');
    const timestamp = moment(time).unix();
    const text = `${title};${articlefulltext}`;
    posts.push(
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
            datasize,
            dataDescription: articlefulltext,
            ingestpurpose: 'darkweb',
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
      selector: ['article'],
      handler: postHandler,
    },
  ],
  1440,
);
