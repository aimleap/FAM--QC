import { PARSER_TYPE } from '../constants/parserType';
import { METADATA } from '../constants/metadata';

export interface Media {
  type: string;
  url: string;
  sizes: object;
  extraData: object;
  thumbnail?: string;
}

export interface TagV2 {
  flag: string;
  values: Map<string, string>;
  displayable?: boolean;
  id?: string;
  sourceName?: string;
  sourceType?: string;
  sourceVersion?: string;
  confidenceScore?: number;
  dependencies?: string[];
}

export interface Metadata {
  [METADATA.SOURCE_NAME]?: string;
  [METADATA.SOURCE_URL]?: string;
  [METADATA.AUTHOR_NAME]?: string;
  [METADATA.AUTHOR_URL]?: string;
  [METADATA.CURRENT_URL]?: string;
  [METADATA.VIA_SNS_TOPIC]?: string;
}

export default class post {
  text: string;

  metadata: Metadata;

  // eslint-disable-next-line camelcase
  posted_at: number;

  // eslint-disable-next-line camelcase
  forum_paths: String[];

  media: Media[];

  extraData: object;

  tagMap: object;

  // eslint-disable-next-line camelcase
  source_channels: string[];

  type: string;

  constructor(
    text: string = '',
    metadata: Metadata,
    postedAt: number = 0,
    forumPaths: String[] = [],
    media: Media[] = [],
    extraData: Map<string, any> = new Map(),
    tagMap: Map<string, TagV2[]> = new Map(),
    sourceChannels: string[] = [],
    type: string = '',
  ) {
    this.text = text;
    this.metadata = metadata;
    this.posted_at = postedAt;
    this.forum_paths = forumPaths;
    this.media = media;
    this.extraData = Object.fromEntries(extraData.entries());
    this.source_channels = sourceChannels;
    this.tagMap = Object.fromEntries(
      Array.from(tagMap.entries()).map(([k, tags]) => [
        k,
        tags.map((props) => ({
          ...props,
          values: Object.fromEntries(props.values.entries()),
        })),
      ]),
    );
    this.type = type;

    if (!this.extraData.hasOwnProperty('parser_type')) {
      // @ts-ignore
      this.extraData.parser_type = PARSER_TYPE.FORUM_PARSER;
    }

    return this;
  }
}
