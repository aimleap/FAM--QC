import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Leaks Site',
  isCloudFlare: false,
  name: 'Cactus Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'https://cactusbloguuodvqjmnzlwetjlpj6aggc6iocwhuupb47laukux7ckid.onion/_next/data/FD7MmWQlZ1c-pCvBZWyAc/index.json?',
  requestOption: {
    strictSSL: false,
    rejectUnauthorized: false,
  },
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);
  jsondata.pageProps.posts.data.forEach((item: any) => {
    const title = item.attributes.title.split('\\')[0];
    const time = item.attributes.publishedAt;
    const timestamp = moment.utc(time).unix();
    const { slug } = item.attributes;
    const link = `https://cactusbloguuodvqjmnzlwetjlpj6aggc6iocwhuupb47laukux7ckid.onion/posts/${slug}`;
    const articlecontent = item.attributes.content;
    const $element = $(articlecontent);
    const textContent = $element.text();
    const text1 = textContent.replace(/(https?|http):\/\/[^\s]+/g, '').replace(/[\t\n\s]+/g, ' ').trim();
    const articlefulltext = textContent.replace(/[\t\n\s]+/g, ' ').trim();
    const text = `${text1}\n${title}`;
    posts.push(
      new Post(
        text,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext,
            date: time,
            ingestpurpose: 'darkweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
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
      selector: ['body'],
      handler: postHandler,
    },
  ],
  1440,
);
