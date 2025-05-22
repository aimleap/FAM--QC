import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  // Removing the first element as it is the header
  elements.shift();
  // removing last element as it is a summary total
  elements.pop();
  elements.forEach((row) => {
    const $el = $(row);
    const name = $el.find('td:nth-child(2)').text();
    const date = $el.find('th a').text();
    const aggregateNoOfPenalties = $el.find('td:nth-child(3)').text();
    const penaltyTotal = $el.find('td:nth-child(4)').text();
    const linkToDetailedInformation = `https://home.treasury.gov${$el.find('th a').attr('href')}`;
    posts.push(
      new Post({
        text: `Name: ${name}, Date: ${date}, Aggregate number of penalties/settlements: ${aggregateNoOfPenalties}, Monthly penalties or settlement total in USD: ${penaltyTotal}, Link to "Detailed Penalties Information": ${linkToDetailedInformation}`,
        postUrl: url,
        postedAt: moment(date, 'MM/DD/YYYY').startOf('day').unix(),
        extraData: {
          Name: name,
          Date: date,
          'Aggregate number of penalties/settlements': aggregateNoOfPenalties,
          'Monthly penalties or settlement total in USD': penaltyTotal,
          'Link to Detailed Penalties Information': linkToDetailedInformation,
        },
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser(
  'USTreasuryPenalties',
  'https://home.treasury.gov/',
  [
    {
      selector: ['table tbody tr'],
      parser: postHandler,
    },
  ],
  'policy-issues/financial-sanctions/civil-penalties-and-enforcement-information',
);
