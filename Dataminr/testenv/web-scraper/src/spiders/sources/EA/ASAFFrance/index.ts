import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'AsaFrance',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.asafrance.fr/nos-actualites/dernieres-actus/',
  requestOption: {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8',
      'cache-control': 'max-age=0',
      cookie:
        'sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2024-08-14%2012%3A25%3A44%7C%7C%7Cep%3Dhttps%3A%2F%2Fwww.asafrance.fr%2Fnos-actualites%2Fdernieres-actus%2F%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2024-08-14%2012%3A25%3A44%7C%7C%7Cep%3Dhttps%3A%2F%2Fwww.asafrance.fr%2Fnos-actualites%2Fdernieres-actus%2F%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_udata=vst%3D1%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F127.0.0.0%20Safari%2F537.36%20Edg%2F127.0.0.0; cookielawinfo-checkbox-fonctionnels=no; cookielawinfo-checkbox-performance=no; cookielawinfo-checkbox-analytics=no; cookielawinfo-checkbox-publicite=no; cookielawinfo-checkbox-autres=no; cookielawinfo-checkbox-necessaires=yes; PHPSESSID=j3tebq7dataroui8hq27fg9adq; sbjs_session=pgs%3D2%7C%7C%7Ccpg%3Dhttps%3A%2F%2Fwww.asafrance.fr%2Fnos-actualites%2Fdernieres-actus%2F',
      priority: 'u=0, i',
      'sec-ch-ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
    },
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h2[class="entry-title"] a').text().trim();
    const link = $(el).find('h2[class="entry-title"] a').attr('href');
    const time = $(el).find('span[class="published"]').text().trim();
    moment.locale('fr');
    const timestamp = moment.utc(time, 'D MMMM YYYY').unix();
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
  const title = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[class="entry-content"] p')
    .text()
    .trim()
    .replace(/\bhttps?:\/\/\S+\b/g, '')
    .replace(/<img[^>]*src="([^"]+)"[^>]*>/g, '')
    .replace(/[\t\n\s]+/g, ' ');
  const time = $(elements).find('span[class="published"]').text().trim();
  const timestamp = moment.utc(time, 'D MMMM YYYY', 'fr').unix();
  posts.push(
    new Post(
      `${title}; ${articlefulltext}`,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          articlefulltext,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class="entry-content"] article'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="main-content"]'],
      handler: postHandler,
    },
  ],
  1440,
);
