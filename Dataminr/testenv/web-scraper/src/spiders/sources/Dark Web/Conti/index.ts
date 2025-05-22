import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ConvertCase } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Conti Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://continewsnv5otx5kaoje7krkto2qbu3gtqef22mnr7eaxw3y6ncz3ad.onion',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];

  elements.forEach((data) => {
    const $ele = $(data);
    let title = $ele.find('.title').text().trim();
    title = title !== undefined ? ConvertCase(title.replace(/['"”“]+/g, '')) : '';
    const victimUrl = $ele.find('a').attr('href').trim();
    const text = ConvertCase($ele.find('.wrap > span').text().trim());
    const eventDate = $ele.find('.footer div:first-child').text().trim();
    const urlPart = $ele.find('.footer a').attr('href').trim();
    const url = urlPart !== undefined ? `${source.url}${urlPart}` : source.url;
    const timestamp = moment.utc(`${eventDate} 00:00:00`, 'MMM DD, YYYY hh:mm:ss').unix();
    posts.push(
      new Post(
        text,
        {
          current_url: url,
        },
        timestamp,
        [],
        [],
        new Map([
          ['date', eventDate],
          ['title', title],
          ['victimUrl', victimUrl],
        ]),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['div.card'],
      handler: postHandler,
    },
  ],
  25,
);
