import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Darkside Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://darksidc3iux462n6yunevoag52ntvwp6wulaz3zirkmh4cnz6hhj7id.onion/',
};
async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  let textUl: string;
  elements.forEach((data) => {
    const $el = $(data);
    const title = $el.find('h5').text().trim();
    let textUlCombined = '';
    const textLen = $el.find('div.col-9 > div > ul > li');
    for (let i = 1; i <= textLen.length; i++) {
      textUl = $el.find(`div.col-9 > div > ul > li:nth-child(${i})`).text().trim().concat(', ');
      textUlCombined += textUl;
    }
    const textPara = $el.find('div.col-9 > div > p').text().trim();
    const text = textUlCombined.length > 0 ? `Data included: ${textUlCombined}` : textPara;
    const date = $el.find('span.text-secondary').text().trim();

    posts.push(
      new Post(
        text,
        {
          current_url: source.url,
        },
        moment().unix(),
        [],
        [],
        new Map(
          Object.entries({
            title,
            datePosted: date,
          }),
        ),
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
      selector: ['div.col-12'],
      handler: postHandler,
    },
  ],
  30,
);
