import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Nebula Marketplace',
  type: SourceTypeEnum.FORUM,
  url: 'http://nebulafnar4bg53vwldad3fjuox2nuuwzvwzleebogthmcagiookp5yd.onion',
};

async function mainHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const link = `http://nebulafnar4bg53vwldad3fjuox2nuuwzvwzleebogthmcagiookp5yd.onion${$(el).attr('href')}`;
    const title = link.split('/')[4];
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'thread',
    });
  });
  return items;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('div[class="title"]').attr('title');
    const link = `http://nebulafnar4bg53vwldad3fjuox2nuuwzvwzleebogthmcagiookp5yd.onion${$(el).attr('href')}`;
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      timestamp,
      parserName: 'post',
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
  const title = $(elements).find('div[class="heading"]:nth-child(2)').text().trim();
  const price = $(elements).find('tr:nth-of-type(1) td:nth-child(3)').text().trim();
  const sellar = $(elements).find('tr:nth-of-type(2) td:nth-child(3)').text().trim();
  const sellerLocation = $(elements).find('tr:nth-of-type(3) td:nth-child(3)').text().trim();
  const shipstoSeller = $(elements).find('tr:nth-of-type(4) td:nth-child(3)').text().trim();
  const shipstoProduct = $(elements).find('tr:nth-of-type(5) td:nth-child(3)').text().trim();
  const category = $(elements).find('tr:nth-of-type(6) td:nth-child(3)').text().trim();
  const quantity = $(elements).find('tr:nth-of-type(7) td:nth-child(3)').text().trim();
  const deadDrop = $(elements).find('tr:nth-of-type(8) td:nth-child(3)').text().trim();
  const articlefulltext = $(elements).find('div[class="tab1"]').text().trim();
  const timestamp = moment().unix();
  items.push(
    new Post(
      `${title}\n${price}`,
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
          price,
          category,
          shipstoProduct,
          sellar,
          quantity,
          sellerLocation,
          shipstoSeller,
          deadDrop,
          articlefulltext,
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
      name: 'main',
      selector: ['div[class="categories"] label+a'],
      handler: mainHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="item"] a:nth-child(2)'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="main"]'],
      handler: postHandler,
    },
  ],
  1440,
);
