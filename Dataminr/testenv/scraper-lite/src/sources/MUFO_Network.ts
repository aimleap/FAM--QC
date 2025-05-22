import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const toUnixTimestamp = (timestamp: string): number => moment.utc(timestamp).unix();

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    const tds = $(el).find('td');

    if (tds.length > 1) {
      const dateOfSubmission = $(tds[1]).text().trim();
      const dateOfEvent = $(tds[2]).text().trim();
      const shortDescription = $(tds[3]).text().trim();
      const city = $(tds[4]).text().trim();
      const stateCountry = $(tds[5]).text().trim();
      const caseNumber = $(tds[0]).text().trim();

      const timestamp = toUnixTimestamp(dateOfSubmission);
      const extraDataInfo = {
        Case_Number: caseNumber,
        Date_of_event: dateOfEvent,
        Short_description: shortDescription,
        City: city,
        State_country: stateCountry,
      };
      posts.push(
        new Post({
          text: `Case number: ${caseNumber}, Date of event: ${dateOfEvent}, Short description: ${shortDescription}, City: ${city}, State/country: ${stateCountry} `,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });

  return posts;
}

export const parser = new LiteParser(
  'Mutual UFO Network',
  'https://mufoncms.com/last_20_report.html',
  [
    {
      selector: ['tbody>tr:not(:has(th))'],
      parser: postHandler,
    },
  ],
);
