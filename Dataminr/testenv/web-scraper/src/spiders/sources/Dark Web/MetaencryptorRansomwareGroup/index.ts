import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leak Site',
  isCloudFlare: false,
  name: 'Metaencryptor Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'https://metacrptmytukkj7ajwjovdpjqzd7esg5v3sg344uzhigagpezcqlpyd.onion/',
  requestOption: { strictSSL: false },
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
    const title = $(el).find('div[class="card-header"]').text().trim();
    const articlefulltext = $(el)
      .find('p[class="card-text"]:nth-of-type(1)')
      .text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const datasize = $(el).find('ul li:nth-child(1)').text().split(':')[1].trim();
    const timeleft = $(el).find('ul li:nth-child(2)').text().split(':')[1].trim();
    const time = $(el).find('small[class="text-muted"]').text().trim();
    const timestamp = parseRelativeTimestamp(time);
    const text = `${title}; ${articlefulltext}; Data size: ${datasize}; Time left: ${timeleft}`;
    if (timestamp !== 0) {
      items.push(
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
              description: articlefulltext,
              datasize,
              timeleft,
              ingestpurpose: 'darkweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return items;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="card shadow-sm border-info shadow-lg"]'],
      handler: postHandler,
    },
  ],
  1440,
);
