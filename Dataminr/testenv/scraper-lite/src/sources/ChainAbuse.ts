import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

const baseURL = 'https://www.chainabuse.com/reports';
async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((el) => {
    const dateTime = $(el).find('.create-ScamReportCard__submitted-info span:eq(2)').text();
    if (moment(dateTime, ['minute ago', 'minutes ago', 'hour ago', 'hours ago']).isSame(moment(), 'day')) {
      const scamType = $(el).find('.create-ScamReportCard__category-label').text();
      const description = $(el).find('.create-ScamReportCard__body .create-LexicalViewer').text().replace(/\n+/g, ' ')
        .replace(/\t+/g, ' ')
        .trim();
      const user = $(el).find('.create-ScamReportCard__submitted-info .create-Link__label').text();
      const coinText = $(el).find('.create-ReportedSection img').attr('alt')?.replace('logo', '');
      const coin = coinText !== undefined ? coinText.trim() : '';
      const address = $(el).find('.create-ReportedSection .create-ResponsiveAddress__text');
      const addressData = [];
      for (let i = 0; i < address.length; i++) {
        const temp = $(address[i]).text();
        addressData.push(temp);
      }
      const domain = $(el).find('.create-ReportedSection .create-ReportedSection__domain').text();
      const timestamp = moment(dateTime, ['minute ago', 'minutes ago', 'hour ago', 'hours ago']).unix();
      const scamInfo = `${scamType} ; ${description} ; ${user} ; ${coin} ; ${addressData.toString()}; ${domain}`;
      const extraDataInfo = {
        'Scam Type': scamType,
        Description: description,
        User: user,
        Coin: coin,
        Address: addressData.toString(),
        Domain: domain,
      };
      posts.push(
        new Post({
          text: scamInfo,
          postUrl: url,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Chain Abuse', baseURL, [
  {
    selector: ['div.create-ScamReportCard'],
    parser: postHandler,
  },
]);
