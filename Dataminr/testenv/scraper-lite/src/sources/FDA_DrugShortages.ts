import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { getThreadArray } from '../lib/parserUtil';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Thread[]> {
  return getThreadArray($, elements, url, 'a', 'a').map((t) => ({
    ...t,
    parserName: 'post',
  }));
}

function extractDiscription(text: any) {
  return text.split('\n')[1].split(':')[1].trim();
}

function extractDate(dateText: any) {
  let date = dateText.split('\n')[5];
  if (typeof date === 'undefined') {
    date = '';
  }
  return date;
}

function extractPostInfo($: CheerioSelector, tds: Cheerio) {
  let availabilityEstimatedShortageDuration = '';
  let shortageReason = '';

  if (tds.length > 3) {
    availabilityEstimatedShortageDuration = $(tds[1]).text().trim();
    shortageReason = $(tds[3]).text().trim();
  }
  const relatedInformation = $(tds[2]).text().trim();
  const text = `Availability and Estimated Shortage Duration: ${availabilityEstimatedShortageDuration}, Related Information: ${relatedInformation}, Sortage Reason: ${shortageReason}`;
  return {
    text,
    availabilityEstimatedShortageDuration,
    relatedInformation,
    shortageReason,
  };
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    try {
      const $el = $(el);
      const nameOfDrug = $el.find('.boldTitle:eq(0)').text().trim();
      const description = extractDiscription($el.find('p:contains(Status:)').contents().text());
      const date = extractDate($el.find('p:contains(Date first posted:)').contents().text());

      $(el)
        .find('div#accordion>h3')
        .each((_rowIndex, row) => {
          const companyName = $(row).text().trim();

          $(el)
            .find(`div#accordion>h3:contains(${companyName})+div tbody tr`)
            .each((_index, eachTr) => {
              const tds = $(eachTr).find('td');
              const postInfo = extractPostInfo($, tds);

              const {
                text,
                availabilityEstimatedShortageDuration,
                relatedInformation,
                shortageReason,
              } = postInfo;

              const extraDataInfo = {
                Date: date,
                Name_of_drug: nameOfDrug,
                Description: description,
                Company: companyName,
                availabilityEstimatedShortageDuration,
                relatedInformation,
                shortageReason,
              };

              posts.push(
                new Post({
                  text: `Date: ${date}, Name of drug: ${nameOfDrug}, Description: ${description}, Company: ${companyName}, ${text}`,
                  postUrl: url,
                  extraData: extraDataInfo,
                }),
              );
            });
        });

      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return posts;
}

export const parser = new LiteParser(
  'FDA Drug shortages',
  'https://www.accessdata.fda.gov/scripts/drugshortages',
  [
    {
      selector: ['div#tabs-4 h3:contains(New)+div ul li'],
      parser: threadHandler,
    },
    {
      selector: ['div.main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/default.cfm',
);
