import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking Forum',
  isCloudFlare: false,
  name: 'Abyss Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/',
  entryUrl: 'static/data.js',
  expireIn: 200,
};

interface AbyssResponse {
  title: string;
  short: string;
  full: string;
  links: string[];
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.body === null) {
    return [];
  }
  const parsedOutput: AbyssResponse[] = JSON.parse(
    response.body
      .replace('let data = ', '')
      .replace(/\s+/g, '')
      .trim()
      .replaceAll("'", '"')
      .replaceAll('"+"', '-'),
  );

  parsedOutput.forEach((item: AbyssResponse) => {
    const domain = item.title;
    const title = item.short;
    const articletext = item.full.replace(/<.*?>/g, '');
    const title1 = item.full.split('<br>')[0];
    let result;

    if (title.includes(title1)) {
      result = title1;
    } else {
      result = domain;
    }
    const timestamp = moment().unix();
    posts.push(
      new Post(
        domain,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: result,
            title,
            articletext,
            domain,
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
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
