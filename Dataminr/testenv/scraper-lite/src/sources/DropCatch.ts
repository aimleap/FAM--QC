import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.dropcatch.com/auctions';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const todaysDate = moment().format('YYYY-MM-DD');
  /* eslint-disable no-await-in-loop */
  for (let index = 1; index <= 5; index++) {
    const options = {
      method: 'POST',
      uri: 'https://client.dropcatch.com/Search',
      body: `{"searchTerm":"","filters":[{"values":[{"Range":{"Min":"${todaysDate}","Max":null}}],"Name":"ExpirationDate"}],"page":${index},"size":1000,"sorts":[{"field":"expirationDate","direction":"Ascending"}]}`,
      headers: {
        'Content-Type': 'application/json',
      },
      resolveWithFullResponse: true,
    };
    let response = null;
    response = await request(options);
    if (response.statusCode !== 200) return [];
    const jsonObj = JSON.parse(response.body);
    const jsonArray = jsonObj.result.items;
    jsonArray.forEach((jObj: any) => {
      const { expirationDate } = jObj;
      const auctionEndTime = moment(expirationDate).utc();
      const currenDateTime = moment().utc();
      const startTime = new Date(currenDateTime.toString());
      const endTime = new Date(auctionEndTime.toString());
      if (endTime.getTime() > startTime.getTime()) {
        const domainName = jObj.name;
        const type = jObj.recordType;
        const timestamp = moment().unix();
        const articleInfo = `${domainName} ; ${type}`;
        const extraDataInfo = {
          auction_url: domainName,
          drop_type: type,
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
  }
  return posts;
}

export const parser = new LiteParser('Drop Catch', baseURL, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
