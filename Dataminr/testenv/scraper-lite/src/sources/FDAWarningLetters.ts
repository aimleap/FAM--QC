import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const $el = $(el);
    const postedDate = $el
      .find('td.views-field.views-field-field-change-date-2.is-active')
      .text()
      .trim();
    if (moment(postedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = $el.find('td.views-field-company-name a').attr('href');
      const subject = $el
        .find('td.priority-low.views-field.views-field-field-detailed-description-2')
        .text()
        .trim();
      const companyName = $el
        .find('td.priority-medium.views-field.views-field-company-name')
        .text()
        .trim();
      const issuingOffice = $el
        .find('td.priority-low.views-field.views-field-field-building')
        .text()
        .trim();

      threads.push({
        link: href,
        title: `${subject}#${postedDate}#${companyName}#${issuingOffice}`,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (
    url
    === 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters'
  ) {
    return posts;
  }

  const $el = $(elements);
  const title = 'FDA Warning Letter';
  const dataInfo = typeof data[0] !== 'undefined' ? data[0].split('#') : '';
  const subject = dataInfo[0];
  const postedDate = dataInfo[1];
  const entitiesSource = 'US FDA';
  const companyName = dataInfo[2];
  const product = $el.find('dt:contains(Product:)+dd').text().replace(/\n+/g, '').trim();
  const issuingOffice = dataInfo[3];
  const warningLetterText = $el
    .find('#main-content p:contains(WARNING LETTER) ~ P')
    .text()
    .replace(/\n+/g, '')
    .trim();

  const warningLetterInfo = `Title: ${title}, Description: ${subject}, Date: ${postedDate}, Entities (source): ${entitiesSource}, Entities (impacted): ${companyName}, Type: ${product}`;

  posts.push(
    new Post({
      text: warningLetterInfo,
      postUrl: url,
      postedAt: moment(postedDate, 'MM/DD/YYYY').startOf('day').unix(),
      extraData: {
        Title: title,
        Description: subject,
        Date: postedDate,
        'Entities (source)': entitiesSource,
        'Entities (impacted)': companyName,
        Type: product,
        'Additional Data': `${issuingOffice}; ${url}; ${warningLetterText}`,
      },
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'FDAWarningLetters',
  'https://www.fda.gov/',
  [
    {
      selector: ['table tbody tr'],
      parser: threadHandler,
    },
    {
      selector: ['main'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters',
);
