import moment from 'moment';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { Response } from 'request';
import { Post } from './types';

export interface Selectors {
  titleSelector: string;
  bodySelector: string;
  imageSelector?: string;
}

export interface ArticleSelectors {
  discussionTitleQuery: string;
  discussionSubTitleQuery: string;
  dateQuery: string;
  articleTextQuery: string;
}

export interface IlboSelectors {
  titleQuery: string;
  dateQuery: string;
  articleTextQuery: string;
}

export interface AnznSelectors {
  keyLocationQuery: string;
  detailedLocationQuery: string;
  eventDescriptionQuery: string;
  dateQuery: string;
  eventTypeQuery: string;
}

export function extractPosts(
  selectors: Selectors,
  elements: CheerioElement[],
  $: CheerioSelector,
  url: string,
  data: string[],
  domainUrl: string,
  location: string,
) {
  const imgSet = new Set();
  return elements.map((element) => {
    const $el = $(element);
    const title = $el.find(selectors.titleSelector).text().trim();
    const body = $el
      .find(selectors.bodySelector)
      .text()
      .trim()
      .replace(/\n+/g, '')
      .replace(/\t+/g, '')
      .substr(0, 1000);
    const datePosted = data[0]?.split('~')[0] === '' ? 'N/A' : data[0]?.split('~')[0];
    const textDescription = data[0]?.split('~')[1] === '' ? 'N/A' : data[0]?.split('~')[1];

    if (selectors.imageSelector !== undefined) {
      $el.find(selectors.imageSelector!.split('~')[0]).each((index, tag) => {
        let imgSrc = $(tag).attr(selectors.imageSelector!.split('~')[1]);
        if (!imgSrc.startsWith('http')) {
          imgSrc = domainUrl + imgSrc;
        }
        imgSet.add(imgSrc);
      });
    }

    return new Post({
      text: `${title}; ${datePosted}; ${textDescription}; ${
        imgSet.size > 0 ? Array.from(imgSet).join(', ') : 'N/A'
      }; ${url}; ${body}`,
      postUrl: url,
      postedAt: moment(datePosted, 'MM/DD/YYYY').unix(),
      extraData: {
        Title: title,
        Description: textDescription,
        Date: datePosted,
        Location: location,
      },
    });
  });
}

export function fetchText(cssSelector: String, $: CheerioSelector, elements: CheerioElement[]) {
  return $(elements).find(`${cssSelector}`).text().replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .trim();
}

export function extractArticlePosts(
  selectors: ArticleSelectors,
  elements: CheerioElement[],
  $: CheerioSelector,
  url: string,
) {
  const dateText = fetchText(selectors.dateQuery, $, elements).split(':')[1].trim();
  const date = moment(dateText, 'DD.MM.YYYY').format('MM/DD/YYYY');
  const discussionTitle = fetchText(selectors.discussionTitleQuery, $, elements);
  const discussionSubTitle = fetchText(selectors.discussionSubTitleQuery, $, elements);
  $(elements).find('h3').remove();
  $(elements).find('.multimedia_files').remove();
  const articleText = fetchText(selectors.articleTextQuery, $, elements);
  const timestamp = moment(date, 'MM/DD/YYYY').unix();
  const newsInfo = `${articleText}`;
  const extraDataInfo = {
    discussion_title: discussionTitle,
    discussion_subTitle: discussionSubTitle,
    Date: date,
  };

  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export function extractIlboPosts(
  selectors: IlboSelectors,
  elements: CheerioElement[],
  $: CheerioSelector,
  url: string,
  data: string[],
) {
  const dateText = fetchText(selectors.dateQuery, $, elements)
    .replace('입력', '')
    .replace('승인', '')
    .trim();
  const date = moment(dateText, 'YYYY.MM.DD hh:mm').format('MM/DD/YYYY');
  const title = fetchText(selectors.titleQuery, $, elements);
  const discreption = data[1];
  const articleText = fetchText(selectors.articleTextQuery, $, elements);
  const timestamp = moment(dateText, 'YYYY.MM.DD hh:mm').unix();
  const newsInfo = `${title} ; ${discreption}`;
  const extraDataInfo = {
    articleText,
    Date: date,
  };
  return [
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  ];
}

export function extractAnznPosts(
  selectors: AnznSelectors,
  url: string,
  response: Response,
): Post[] {
  const posts: Post[] = [];
  const $ = cheerio.load(iconv.decode(response.body, 'euc-jp').toString());
  const elements = $('div[data-role="collapsible"]').get();
  elements.forEach((el) => {
    const dateTime = $(el).find(selectors.dateQuery).text().replace('頃配信', '')
      .trim();
    const date = dateTime.split(' ')[0];
    const time = dateTime.split(' ')[1].replace('頃', '').trim();
    const formattedDate = moment(date, 'MM/DD').format('MM/DD/YYYY');
    if (moment(formattedDate, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const keyLocation = $(el).find(selectors.keyLocationQuery).text();
      const detailedLocation = $(el).find(selectors.detailedLocationQuery).text();
      const eventDescription = $(el).find(selectors.eventDescriptionQuery).text();
      const timestamp = moment(formattedDate, 'MM/DD/YYYY').unix();
      $(el).find('small, .cSmall').remove();
      const eventType = $(el)
        .find(selectors.eventTypeQuery)
        .text()
        .replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const articleInfo = `${formattedDate} ; ${time} ; ${keyLocation} ; ${detailedLocation} ; ${eventType}`;
      const extraDataInfo = {
        Date: formattedDate,
        Time: time,
        'Key Location': keyLocation,
        'Event Type': eventType,
        'Detailed Location': detailedLocation,
        'Event Description': eventDescription,
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}
