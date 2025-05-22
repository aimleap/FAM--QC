import moment from 'moment';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'New Security Bulletins and Briefs',
  isCloudFlare: false,
  name: 'Asus',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.asus.com/content/asus-product-security-advisory/',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const title = $(el).find('strong').text().trim();
    const published = $(el).text().trim().split(' ')[0];
    const summary = $(el).find('+ div[class="sec-desc"] p').first().text()
      .trim()
      .replace(/[\t\n\s]+/g, ' ');
    const cveRegex = /CVE-\d{4}-\d{4,7}/g;
    const cveMatches = title.match(cveRegex) || [];
    const cves = cveMatches.length ? cveMatches.join(', ') : '';
    const affectedElements = $(el).find('+ div[class="sec-desc"] table tr').get().slice(1);
    const affectedArr: string[] = [];
    affectedElements.forEach((item) => {
      const text = $(item).find('td:first-child p').text().trim();
      if (text !== '') {
        affectedArr.push(text);
      }
    });
    let impactedproducts = '';

    if (affectedArr.length > 0) {
      impactedproducts = affectedArr.join(', ');
    } else {
      impactedproducts = '';
    }
    const timestamp = moment.utc(published, 'MM/DD/YYYY').unix();
    if (timestamp) {
      posts.push(
        new Post(
          `${title}; ${summary}; ${published}`,
          {
            current_url: url,
          },
          timestamp,
          [],
          [],
          new Map(
            Object.entries({
              published,
              cves,
              impactedproducts,
              ingestpurpose: 'deepweb',
              parser_type: PARSER_TYPE.AIMLEAP_PARSER,
            }),
          ),
        ),
      );
    }
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div[class="sec-title"]'],
      handler: postHandler,
    },
  ],
  1440,
);
