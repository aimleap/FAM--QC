import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: false,
  name: 'Rhysida Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/',
  expireIn: 200,
};

async function threadHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const links = [
    'http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/archive.php',
    'http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/archive.php?auction',
  ];
  links.forEach((el) => {
    const link = el;
    const timestamp = moment().unix();
    items.push({
      title: '',
      link,
      parserName: 'post',
      timestamp,
    });
  });
  return items;
}

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  const entrySelector = $(elements).find('div[class="border m-2 p-2"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('div[class="m-2 h4"] a').text().trim();
    const domain = $(el).find('div[class="m-2 h4"] a').attr('href');
    const description = $(el).find('div[class="m-2 h4"] + div').text().trim();
    const documentDataCatalogue = $(el)
      .find('div[class="m-2"] p:first-child')
      .text()
      .split(': ')[1];
    const percentage = $(el).find('div[class="progress"] div').text().trim();
    const timestamp = moment().unix();
    const text = `${description}\n${title}`;
    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            domain,
            documentDataCatalogue,
            percentage,
            articlefulltext: description,
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
      name: 'thread',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
