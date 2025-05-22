import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const todaysDate = moment().format('YYYY-MM-DD hh:mm:ss');
const todaysDateFormatted = moment().format('YYYY-MM-DD');
const tomorrowDate = moment().add(1, 'day').format('YYYY-MM-DD');

const baseURL = 'https://auctions.godaddy.com/beta';
const apiURL = `https://auctions.godaddy.com/beta/findApiProxy/v3/aftermarket/find/auction/recommend?endTimeAfter=${todaysDateFormatted}&endTimeBefore=${tomorrowDate}&paginationSize=1000&paginationStart=0&sortBy=auctionEndTime%3Aasc&typeIncludeList=16%2C38&useSemanticSearch=false`;

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  const responseText = response.body;
  const jsonObj = JSON.parse(responseText);
  const jsonArray = jsonObj.results;
  jsonArray.forEach((jObj: any) => {
    const domain = jObj.fqdn_from_feed;
    const timeText = jObj.auction_end_time;
    const currTime = new Date(todaysDate);
    const endTime = new Date(timeText);
    if (endTime.getTime() > currTime.getTime()) {
      const type = 'Auction';
      const timestamp = moment(todaysDate, 'YYYY-MM-DD hh:mm:ss').unix();
      const articleInfo = `${domain}`;
      const extraDataInfo = {
        auction_url: domain,
        drop_type: type,
      };
      posts.push(
        new Post({
          text: articleInfo,
          postUrl: baseURL,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser(
  'Go Daddy',
  apiURL,
  [
    {
      selector: ['*'],
      parser: postHandler,
      name: 'post',
    },
  ],
);
