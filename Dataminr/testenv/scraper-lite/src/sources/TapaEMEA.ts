import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((el) => {
    const $el = $(el);
    const dateText = $el.find('p:contains(Date)+p').text();
    const date = moment(dateText, 'MMMM DD, YYYY').format('DD/MM/YYYY');
    const incidentCategory = $el.find('p.font-small.color-2').text();
    const modusOperandi = $el.find('p:contains(Modus Operandi)+p').text();
    const description = $el.find('.incidents-text *:not(p.font-small.color-2)').text().replace(/\n+/g, '').replace(/\s+/g, ' ')
      .trim();
    const location = $el.find('p:contains(Location)+p').text();
    const timestamp = moment(date, 'DD/MM/YYYY').unix();
    const incidentInfo = `Date: ${date}, Incident Category: ${incidentCategory}, Modus Operandi: ${modusOperandi}, Description: ${description},  Location: ${location}`;
    const extraDataInfo = {
      Date: date,
      'Incident Category': incidentCategory,
      'Modus Operandi': modusOperandi,
      Description: description,
      Location: location,
    };

    posts.push(
      new Post({
        text: incidentInfo,
        postUrl: url,
        postedAt: timestamp,
        extraData: extraDataInfo,
      }),
    );
  });
  return posts;
}

export const parser = new LiteParser('TAPA EMEA', 'https://tapaemea.org/', [
  {
    selector: ['.max-block-incidents.bg-body div.swiper-slide'],
    parser: postHandler,
    name: 'post',
  },
]);
