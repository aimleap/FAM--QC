import moment from 'moment';
import _ from 'lodash';
import { Post } from './types';

export interface NewsArticleSchema {
  article_link: string;
  article_text: string;
  discussion_title: string;
  post_date: number;
  extradata?: object;
}

export interface TabularSchema {
  data: object;
  event_link: string;
  post_date?: number;
}

export function toNewsArticleSchema(news: NewsArticleSchema): Post {
  const post = new Post({
    text: news.article_text.trim().slice(0, 300),
    postedAt: news.post_date,
    postUrl: news.article_link,
    extraData: news.extradata || {},
  });

  // @ts-ignore
  post.extraData.discussion_title = news.discussion_title;
  // @ts-ignore
  post.extraData.post_date = moment(news.post_date).format('MM/DD/YYYY hh:mm A');
  // @ts-ignore
  post.extraData.schema = 'NEWS_ARTICLE';

  return post;
}

export function toTabularSchema(tabular: TabularSchema): Post {
  const composedText = _.reduce(tabular.data, (p, v, k) => p.concat(`${k}: ${v}, `), '');
  return new Post({
    text: composedText,
    postedAt: tabular.post_date || moment().unix(),
    postUrl: tabular.event_link,
    extraData: {
      ...tabular.data,
      schema: 'TABULAR',
    },
  });
}
