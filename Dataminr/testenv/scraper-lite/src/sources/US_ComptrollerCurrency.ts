import request from 'request-promise';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const DOMAIN_URL = 'https://www.occ.treas.gov';
const API_DOMAIN_URL = 'https://apps.occ.gov';

interface Link {
  Title: null;
  Url: null;
}

interface OccArticle {
  SiteId: number;
  ContentId: number;
  NewsType: number;
  ContentItemName: string;
  IssuanceDescription: null;
  ReleaseId: string;
  SubTitle: string;
  ContentTitle: string;
  PostDate: string;
  PublishDate: string;
  ContentType: string;
  SubType: string;
  Topics: string[];
  Url: string;
  Links: Link[];
}

async function threadHandler(): Promise<Thread[]> {
  const options = {
    method: 'POST',
    uri: appendLink(
      API_DOMAIN_URL,
      '/Occ.DataServices.WebApi.Public/api/NewsItems/Site/516/Search/Options',
    ),
    body: '{"Keywords":[],"Topics":[],"NewsTypes":["NewsRelease"],"EarliestPublishDateTime":null,"LatestPublishDateTime":null}',
    headers: {
      'Content-Type': 'application/json',
    },
    resolveWithFullResponse: true,
  };

  const response = await request(options);
  if (response.statusCode !== 200) return [];

  const json: OccArticle[] = JSON.parse(response.body);
  if (json.length === 0) return [];

  return json
    .filter((x) => moment().isSame(moment(x.PostDate), 'day'))
    .map(({ Url: link, ContentTitle: title }) => ({
      link,
      title,
      parserName: 'post',
    }));
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  if (url.search(/\.html$/) === -1) return [];

  const posts: Post[] = [];
  const $el = $(elements);
  const title = $el.find('.main-content h1').text().replace(/\n+/g, '').trim();
  const date = $el.find('.main-content .date').text().trim();
  const source = 'US Comptroller of the Currency';
  const fullText = $el.find('.main-content .ctcol p').text().replace(/\n+/g, '').trim();
  const timestamp = moment(date, 'LL').unix();

  const newsInfo = `Title: ${title}, Date: ${date}, Source: ${source}, "Additional Data:" ${fullText}`;
  const extraDataInfo = {
    'Additional Data': fullText,
  };
  posts.push(
    new Post({
      text: newsInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser('US Comptroller of the Currency', DOMAIN_URL, [
  {
    selector: ['*'],
    parser: threadHandler,
  },
  {
    selector: ['*'],
    parser: postHandler,
    name: 'post',
  },
]);
