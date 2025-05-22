import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'General Market',
  isCloudFlare: true,
  name: 'Apple Love',
  type: SourceTypeEnum.FORUM,
  url: 'http://timlkwvr5kltqs7j7u4iohieiqzk7lpv5m34r6livlqz2wlfd5e4jkid.onion/',
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[id="u199-4"] p').text().trim();
    const link = `http://timlkwvr5kltqs7j7u4iohieiqzk7lpv5m34r6livlqz2wlfd5e4jkid.onion/${$(el).find('a[id="u210-4"]').attr('href')}`;
    const timestamp = moment().unix();
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
  const posts: Post[] = [];
  const title = $(elements).find('div[id="u1113-4"] p').text().trim();
  const Colors = $(elements).find('div[id="pu1116"] p:nth-of-type(1)').text().trim()
    .split(': ')[1];
  const Cpu = $(elements).find('div[id="pu1116"] p:nth-of-type(2)').text().trim()
    .split(': ')[1];
  const phonestorage = $(elements).find('div[id="pu1116"] p:nth-of-type(3)').text().trim()
    .split(': ')[1];
  const memory = $(elements).find('div[id="pu1116"] p:nth-of-type(4)').text().trim()
    .split(': ')[1];
  const screensize = $(elements).find('div[id="pu1116"] p:nth-of-type(5)').text().trim()
    .split(': ')[1];
  const Camera = $(elements).find('div[id="pu1116"] p:nth-of-type(6)').text().trim()
    .split(': ')[1];
  const frontCamera = $(elements).find('div[id="pu1116"] p:nth-of-type(7)').text().trim()
    .split(': ')[1];
  const Connectivety = $(elements).find('div[id="pu1116"] p:nth-of-type(8)').text().trim()
    .split(': ')[1];
  const Battery = $(elements).find('div[id="pu1116"] p:nth-of-type(9)').text().trim()
    .split(': ')[1];
  const Security = $(elements).find('div[id="pu1116"] p:nth-of-type(10)').text().trim()
    .split(': ')[1];
  const phonetype = $(elements).find('div[id="u1195-4"]:nth-child(3)').text().trim();
  const entrySelector = $(elements).find('div[id="pu1139-4"]').get();
  entrySelector.forEach((el) => {
    const Storage = $(el).find('div[id="u1139-4"] span').text().trim();
    const Shippingdetails = $(el).find('div[id="u1148-4"] p').text().trim()
      .replace(/^\s+|\n+$/gm, '');
    const price = $(el).find('div[id="u1157-4"] span').text().trim();
    const timestamp = moment().unix();
    const text = `${title}\n${price}`;
    posts.push(
      new Post(
        text,
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
            phonestorage,
            Cpu,
            memory,
            phonetype,
            Security,
            Camera,
            Battery,
            screensize,
            Colors,
            frontCamera,
            Connectivety,
            Storage,
            price,
            Shippingdetails,
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
      selector: ['div[id="pu161"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="u1110"]'],
      handler: postHandler,
    },
  ],
  1440,
);
