import moment from 'moment';
import _ from 'lodash';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://conferencealerts.com/';
async function preThreadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const preThreads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href').replace('?', '.php?page=1&ipp=All&');
    const headline = $(el).text();
    preThreads.push({
      link: href,
      title: headline,
      parserName: 'threads',
    });
  });
  return preThreads;
}
async function threadHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Thread[]> {
  const threads: Thread[] = [];

  const currentYear = moment().format('YYYY');
  const currentMonth = moment().format('MMMM');
  const nextMonth = moment().add(1, 'months').format('MMMM');
  const afterNextMonth = moment().add(2, 'months').format('MMMM');

  const monthsArray = [currentMonth, nextMonth, afterNextMonth];
  monthsArray.forEach((month) => {
    for (let i = 0; i < elements.length; i++) {
      const tdTag = $(elements[i]).find('.textLeft').text();
      if (tdTag.includes(month) && tdTag.includes(currentYear)) {
        for (let j = i + 1; j < elements.length; j++) {
          if ($(elements[j]).toString().includes('<strong>')) {
            break;
          }
          const dayOfEvent = $(elements[j]).find('.textLeft.bold').text();

          if (dayOfEvent !== '') {
            const eventDate = moment(`${dayOfEvent} ${month} ${currentYear}`, 'Do MMMM YYYY');
            const current = moment().startOf('day');
            const days = moment.duration(eventDate.diff(current)).asDays();
            const href = $(elements[j]).find('td.textLeft>span#searchName>a').attr('href');
            const headline = `${dayOfEvent} ${month} ${currentYear} ~ ${days}`;

            threads.push({
              link: href,
              title: headline,
              parserName: 'post',
              delay: 1000 * 9 * _.random(0, 6),
            });
          }
        }
      }
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
  if (url === baseUrl) {
    return posts;
  }
  const eventTitleQuery = '#eventNameHeader';
  const locationQuery = '#eventCountry';
  const descriptionQuery = '#eventDescription';
  const organisedByQuery = '#eventOrganiser';
  const eventWebsiteQuery = '#eventWebsite a';

  const eventDate = data[1].split('~')[0];
  const eventTitle = fetchText(eventTitleQuery, $, elements);
  const eventLocation = fetchText(locationQuery, $, elements);
  const eventDescription = fetchText(descriptionQuery, $, elements);
  const organisedBy = fetchText(organisedByQuery, $, elements);
  const eventWebsite = fetchText(eventWebsiteQuery, $, elements);
  const daysAway = `${data[1].split('~')[1]} Days`;
  const extraDataText = {
    'Event date': eventDate,
    'Event title': eventTitle,
    'Event location': eventLocation,
    'Organized by': organisedBy.replace('Organized by: ', ''),
    URL: url,
    'Event website': eventWebsite,
    'Days Away': daysAway,
  };
  const timestamp = moment(eventDate, 'Do MMMM YYYY').unix();
  const noticeReleaseInfo = `${eventDate} - ${eventTitle} - ${eventLocation}; Event Description: ${eventDescription}; Organized by: ${organisedBy}; URL: ${url} - Website: ${eventWebsite}`;
  posts.push(
    new Post({
      text: noticeReleaseInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataText,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Conal Conference Alerts', baseUrl, [
  {
    selector: [
      'a:contains(Artificial Intelligence),a:contains(Information Technology),a:contains(Robotics),a:contains(Military),a:contains(Image Processing)',
    ],
    parser: preThreadHandler,
  },
  {
    selector: ['table#searchResultTable>tbody>tr'],
    parser: threadHandler,
    name: 'threads',
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
