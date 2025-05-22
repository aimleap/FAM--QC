import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const API_DOMAIN_URL = 'https://www.landespolizei.li';

interface Thumbnail {
  description: string;
  fID: number;
  large: string;
  medium: string;
  relativePath: string;
  small: string;
  title: string;
}

interface LiechtensteinPolice{
  createdDate: number;
  description: string;
  detailURL: string;
  eventTitle: string;
  expirationDate: null;
  id: number;
  images: null;
  isActive: boolean;
  lastModifiedDate: number;
  latitude: number;
  longitude: number;
  place: string;
  postType: string;
  publishDate: number;
  recommendedBehaviorDescription: string;
  recommendedBehaviorTitle: string;
  sourceText: string;
  summary: string;
  thumbnail: Thumbnail[];
  title: string;
  youtubeURL: string;
}

async function postHandler(
  $: CheerioSelector,
): Promise<Post[]> {
  const posts: Post[] = [];
  const options = {
    method: 'POST',
    uri: appendLink(
      API_DOMAIN_URL,
      '/swlp/api/v1/news',
    ),
    body: '{"page": "1","pageLimit": "10","sortPagesBy": "publishDate", "sortPagesDirection": "DESC", "token": "1664453652:d8b550c675d1508df6a8490c6a20a049"}',
    headers: {
      'Content-Type': 'application/json',
    },
    resolveWithFullResponse: true,
  };

  const response = await request(options);
  if (response.statusCode !== 200) return [];
  const responseText = JSON.parse(response.body);
  const jsonArray: LiechtensteinPolice[] = responseText.data.entries;
  jsonArray.forEach((jObj: any) => {
    const date = jObj.createdDate;
    const dateFormatted = new Date(date * 1000).toLocaleString();
    if (moment(dateFormatted, 'DD/MM/YYYY, hh:mm:ss').isSame(moment(), 'day')) {
      const { title } = jObj;
      const text = jObj.description;
      const formattedText = $(text).text().replace(/\n+/g, ' ').replace(/\t+/g, '')
        .trim();
      const postURL = jObj.detailURL;
      const timestamp = date;
      const articleInfo = `${dateFormatted} ; ${formattedText}`;
      const extraDataInfo = {
        discussion_title: title,
      };

      posts.push(
        new Post({
          text: articleInfo,
          postUrl: postURL,
          postedAt: timestamp,
          extraData: extraDataInfo,
        }),
      );
    }
  });
  return posts;
}

export const parser = new LiteParser('Liechtenstein Police', API_DOMAIN_URL, [
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
