import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum, ConvertCase } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: 'MyMilitia',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.mymilitia.com/',
  requestOption: {
    strictSSL: false,
    rejectUnauthorized: false,
  },
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  const results: any[] = [];
  elements.forEach((el) => {
    const timestamp = $(el).find('.cWidgetStreamTime time').attr('datetime');
    const postTime = moment.utc(timestamp, 'YYYY-MM-DDTHH:mm:ss').unix();
    const messageText = ConvertCase(
      $(el)
        .find('div.ipsType_richText')
        .text()
        .trim()
        .replace(/(\r\n|\n|\r)/gm, ''),
    );
    const url = $(el).find('div.cWidgetStreamTime a:nth-child(2)').attr('href');
    const username = $(el).find('div.cWidgetStreamTime a:nth-child(3)').text().trim();
    if (url === undefined || messageText === '' || postTime === undefined) return;
    results.push({
      postTime,
      text: messageText,
      link: url,
      author_name: username,
    });
    const uniquePosts = Array.from(new Set(results.map((a) => a.link))).map((link) => results.find((a) => a.link === link));
    uniquePosts.forEach((message: any) => {
      posts.push(
        new Post(
          message.text,
          {
            current_url: message.link,
            author_name: message.author_name,
          },
          message.postTime,
        ),
      );
    });
  });

  return posts;
}
export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['.cWidgetStreamList div'],
      handler: postHandler,
    },
  ],
  35,
);
