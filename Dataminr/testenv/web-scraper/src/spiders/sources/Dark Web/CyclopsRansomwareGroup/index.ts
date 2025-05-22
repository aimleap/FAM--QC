import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'Cyclops Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://nt3rrzq5hcyznvdkpslvqbbc2jqecqrinhi5jtwoae2x7psqtcb6dcad.onion/',
  expireIn: 200,
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="block-content"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('h2').text().trim();
    const autherdate = $(el).find('p[class="fs-sm"]').text().trim();
    const articlefulltext = $(el).find('strong p').contents().text()
      .trim();
    const description = articlefulltext.split('Data:')[0];
    const matchResult = autherdate.match(/^(\S+)\s(.*)/);
    const finaldate = matchResult ? matchResult.slice(1)[1] : null;
    const timestamp = moment.utc(finaldate, 'YYYY-MM-DD h:mm:ss a').unix();

    posts.push(
      new Post(
        `${title}\n${autherdate}\n${description}`,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            date: finaldate,
            description,
            ingestpurpose: 'darkweb',
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
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
