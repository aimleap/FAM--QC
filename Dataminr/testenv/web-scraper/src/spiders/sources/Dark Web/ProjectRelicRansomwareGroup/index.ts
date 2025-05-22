import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Project Relic Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://relic5zqwemjnu4veilml6prgyedj6phs7de3udhicuq53z37klxm6qd.onion/',
  expireIn: 200,
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const title = $el.find('div[class="name"]').text().trim();
    const address = $el.find('div[class="addr column"] p').text().split('HQ')[1].trim();
    const revenue = $el.find('div[class="revenue"]').text().trim().split('Annual revenue ')[1];
    const website = $el.find('div[class="website"] a').attr('href');
    const articletext = $(el).find('div[class="description"]').contents().text()
      .trim();
    const phone = $(el).find('div[class="phones"] p').text().trim();
    const timestamp = moment().unix();
    posts.push(
      new Post(
        title,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            title,
            address,
            revenue,
            website,
            articlefulltext: articletext,
            phone,
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
      selector: ['div[class="content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
