import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.ftc.gov/legal-library/browse/cases-proceedings';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const lastUpdated = $(el).find('.field__label:contains(Last Updated)+.field__items .field__item>time').text();
    const companyName = $(el).find('h3.node-title').text().trim();
    const summary = $(el).find('.field--type-text-with-summary').text().replace(/\n+/g, ' ')
      .trim();
    const typeOfAction = $(el).find('.field__label:contains(Type of Action)+.field__items').text().trim();
    const caseStatus = $(el).find('.field__label:contains(Case Status)+.field__items').text().trim();
    const timestamp = moment(lastUpdated, 'MMMM DD, YYYY').unix();
    const caseProceedingsInfo = `${companyName}; ${summary}; Type Of Action: ${typeOfAction}; Last Updated: ${lastUpdated}; Case Status: ${caseStatus}`;
    const extraDataText = {
      'Company Name': companyName, 'Type Of Action': typeOfAction, 'Last Updated': lastUpdated, 'Case Status': caseStatus,
    };
    if (moment(lastUpdated, 'MMM DD, YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: caseProceedingsInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Federal Trade Commission', baseURL, [
  {
    selector: ['.main .view-content .views-row article'],
    parser: postHandler,
  },
]);
