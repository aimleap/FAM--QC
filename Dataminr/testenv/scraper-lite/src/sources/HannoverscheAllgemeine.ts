import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { fetchText } from '../lib/sourceUtil';

const baseUrl = 'https://www.haz.de';
async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<Thread[]> {
  const threads: Thread[] = [];
  elements.forEach((el) => {
    const href = $(el).attr('href');
    const headline = $(el).find('h2 span:not(.ContentTeaserstyled__PaidIconContainer-qm705w-9)').text().trim();
    threads.push({
      link: href,
      title: headline,
      parserName: 'post',
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === baseUrl) return posts;
  moment.locale('de');
  const titleQuery = '#article div.ArticleHeadstyled__ArticleHeadHeadlineContainer-sc-1xd2qac-0';
  const dateQuery = '#article time';
  const articleFullTextQuery = '.Textstyled__Text-sc-14jlruk-0';
  const dateText = fetchText(dateQuery, $, elements).trim();
  const date = moment(dateText, 'DD.MM.YYYY, hh:mm a').format('MM/DD/YYYY');
  if (!moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) return posts;
  $(elements).find('#article div.ArticleHeadstyled__ArticleHeadHeadlineContainer-sc-1xd2qac-0 span').remove();
  const title = fetchText(titleQuery, $, elements);
  const articleFullText = fetchText(articleFullTextQuery, $, elements);
  const timestamp = moment(dateText, 'DD.MM.YYYY, hh:mm a').unix();
  const articleInfo = `${title}`;
  const extraDataInfo = {
    title,
    articleFullText,
    ingestpurpose: 'mdsbackup',
    date,
  };
  posts.push(
    new Post({
      text: articleInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('Hannoversche Allgemeine', baseUrl, [
  {
    selector: ['.ChainContainerstyled__ChainContainer-tk4a49-0 a.Linkstyled__Link-amotau-0.ContentTeaserstyled__Link-qm705w-12'],
    parser: threadHandler,
  },
  {
    selector: ['body'],
    parser: postHandler,
    name: 'post',
  },
]);
