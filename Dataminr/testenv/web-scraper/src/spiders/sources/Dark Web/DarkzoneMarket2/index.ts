import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Dark Market',
  isCloudFlare: false,
  name: 'Darkzone Market 2',
  type: SourceTypeEnum.FORUM,
  url: 'http://shoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion/market-place',
  requestOption: {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US;q=0.5,en;q=0.3',
      'Cache-Control': 'max-age=0',
      Connection: 'keep-alive',
      Cookie:
        'sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_udata=vst%3D1%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28X11%3B%20Linux%20x86_64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F110.0.0.0%20Safari%2F537.36; sbjs_session=pgs%3D1%7C%7C%7Ccpg%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place; activechatyWidgets=0; chatyWidget_0=[{"k":"v-widget","v":"2024-01-17T14:30:07.790Z"},{"k":"v-Telegram","v":"2024-01-17T14:30:07.792Z"}]',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  },
};

async function mainThreadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  const entrySelector = $(elements)
    .find('header[class="hp-listing-category__header"]')
    .get()
    .slice(5);
  entrySelector.forEach((el) => {
    const link = $(el).find('a').attr('href');
    const title = $(el).find('a img').attr('alt');
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'thread',
      timestamp,
      requestOption: {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US;q=0.5,en;q=0.3',
          'Cache-Control': 'max-age=0',
          Connection: 'keep-alive',
          Cookie:
            'sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_udata=vst%3D1%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28X11%3B%20Linux%20x86_64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F110.0.0.0%20Safari%2F537.36; sbjs_session=pgs%3D1%7C%7C%7Ccpg%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place; activechatyWidgets=0; chatyWidget_0=[{"k":"v-widget","v":"2024-01-17T14:30:07.790Z"},{"k":"v-Telegram","v":"2024-01-17T14:30:07.792Z"}]',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
      },
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
    const link = encodeURI($(el).find('a').attr('href'));
    const title = $(el).find('a').text().trim();
    const timestamp = moment().unix();
    items.push({
      title,
      link,
      parserName: 'post',
      timestamp,
      requestOption: {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US;q=0.5,en;q=0.3',
          'Cache-Control': 'max-age=0',
          Connection: 'keep-alive',
          Cookie:
            'sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2024-01-17%2014%3A29%3A58%7C%7C%7Cep%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2Fmarket-place%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29; sbjs_udata=vst%3D1%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28X11%3B%20Linux%20x86_64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F110.0.0.0%20Safari%2F537.36; activechatyWidgets=0; chatyWidget_0=[{"k":"v-widget","v":"2024-01-17T14:30:07.790Z"},{"k":"v-Telegram","v":"2024-01-17T14:30:07.792Z"}]; sbjs_session=pgs%3D3%7C%7C%7Ccpg%3Dhttp%3A%2F%2Fshoprypxphsufyldigdn34kbjbsnjnrmv2z34yc5al5lkmveqcbex2qd.onion%2FBuylisting%2Fitaly-id-card',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        },
      },
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
  elements.forEach((el) => {
    const title = $(el).find('h1[class="hp-listing__title"] span').text().trim();
    const price = $(el).find('div[data-block="listing_attributes_primary"]').text().trim();
    const articlefulltext = $(el)
      .find('div[class="hp-listing__description"] p')
      .contents()
      .text()
      .replace(/[\t\n\s]+/g, ' ')
      .trim();
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
            articlefulltext,
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
      name: 'main-thread',
      selector: ['div[class="hp-page__content"]'],
      handler: mainThreadHandler,
    },
    {
      name: 'thread',
      selector: ['div[class="hp-listings hp-block hp-grid"] h4[class="hp-listing__title"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[class="site-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
