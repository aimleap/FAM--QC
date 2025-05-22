import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://ofac.treasury.gov/civil-penalties-and-enforcement-information';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const dateOfPenalty = $(el).find('th').text();
    const name = $(el).find('td:eq(0)').text().trim();
    const aggregateNumberOfPenalties = $(el).find('td:eq(1)').text().replace(/\n+/g, ' ')
      .trim();
    const penaltiesSettlementsTotalInUSD = $(el).find('td:eq(2)').text().trim();
    const timestamp = moment(dateOfPenalty, 'MM/DD/YYYY').unix();
    const penaltiesInfo = `${dateOfPenalty}; ${name}; ${aggregateNumberOfPenalties}; ${penaltiesSettlementsTotalInUSD}`;
    const extraDataText = {
      'Date Of Penalty': dateOfPenalty, Name: name, 'Aggregate Number of Penalties, Settlements, or Findings of Violation': aggregateNumberOfPenalties, 'Penalties/Settlements Total in USD': penaltiesSettlementsTotalInUSD,
    };
    if (moment(dateOfPenalty, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      posts.push(
        new Post({
          text: penaltiesInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataText,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('US Department Of Treasury Office Of Foreign Assets Control', baseURL, [
  {
    selector: ['table.usa-table tbody tr'],
    parser: postHandler,
  },
]);
