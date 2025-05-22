import { Response } from 'request';
import moment from 'moment';

export interface Media {
  type: string;
  url: string;
  sizes: object;
  extraData: object;
}

/* eslint-disable camelcase */

export interface Metadata {
  current_url?: string;
  author_name?: string;
  author_url?: string;
}

export class Post {
  text: string;

  metadata: Metadata;

  posted_at: number;

  forum_paths: string[];

  extraData: object;

  media: Media[];

  constructor({
    text,
    postedAt = moment().unix(),
    postUrl,
    authorUrl,
    authorName,
    forumPaths = [],
    metadata = {},
    extraData = {},
    media = [],
  }: {
    text: string;
    postedAt?: number;
    postUrl?: string;
    authorUrl?: string;
    authorName?: string;
    forumPaths?: string[];
    metadata?: Metadata;
    extraData?: object;
    media?: Media[];
  }) {
    this.text = text;
    this.metadata = metadata;
    this.posted_at = postedAt;
    this.forum_paths = forumPaths;
    this.extraData = extraData;
    this.media = media;

    if (postUrl) this.metadata.current_url = postUrl;
    if (authorName) this.metadata.author_name = authorName;
    if (authorUrl) this.metadata.author_url = authorUrl;

    if (!this.extraData.hasOwnProperty('parser_type')) {
      // @ts-ignore
      this.extraData.parser_type = 'COGNIZANT';
    }

    return this;
  }
}

/* eslint-enable camelcase */

export interface Thread {
  link: string;
  title?: string;
  timestamp?: number;
  parserName?: string;
  delay?: number;
}

export interface Task {
  link: string;
  data: (string | null)[]; // pass thread data through this field
  handlerName?: string;
}

export type parseHandler = (
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
) => Promise<(Post | Thread)[]>;

export interface Handler {
  selector: string[];
  parser: parseHandler;
  name?: string;
}

export interface requestOptions {
  method?: string;
  url?: string;
  encoding?: string;
  strictSSL?: boolean;
  userAgent?: string;
}
