import { parseRelativeTimestamp } from 'scraper-lite/dist/lib/timestampUtil';
import moment from 'moment';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'Bitcoin Abuse',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.chainabuse.com/reports?page=0&sort=newest',
};

async function paginationHandler(): Promise<ThreadType[]> {
  const items: ThreadType[] = [];
  for (let i = 0; i < 10; i++) {
    const link = `https://www.chainabuse.com/reports?page=${String(i)}&sort=newest`;
    const timestamp = moment().unix();
    items.push({
      title: '',
      link,
      parserName: 'post',
      timestamp,
    });
  }
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
  const entrySelector = $(elements).find('div[class="create-ScamReportCard"]').get();
  entrySelector.forEach((el) => {
    const title = $(el).find('p[class*="category"]').text().trim();
    const reportedDomain = $(el).find('div[class="create-ReportedSection__address-section"]').contents().text()
      .trim();
    const reportedTime = $(el).find('div[class="create-ScamReportCard__submitted-info"] span[class*="h5"]:last-child').text().trim();
    const articlefulltext = $(el).find('div[class="create-ScamReportCard__preview-description-wrapper"]').contents().text()
      .trim()
      .replace(/[\r\t\n\s]+/g, ' ');
    const author = $(el).find('a[class*="author"] span').text().trim();
    const timestamp = parseRelativeTimestamp(reportedTime);
    posts.push(
      new Post(
        articlefulltext,
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
            reportedDomain,
            reportedTime,
            author,
            articlefulltext,
            ingestpurpose: 'deep web',
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
      name: 'pagination',
      selector: ['*'],
      handler: paginationHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
