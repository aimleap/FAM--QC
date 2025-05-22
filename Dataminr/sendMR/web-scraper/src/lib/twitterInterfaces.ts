import { GuestBearerToken } from './twitterUtils';

export interface TwitterCustomIngestUser {
  // eslint-disable-next-line no-undef
  id: BigInt;
  id_str: string;
  name: string;
  screen_name: string;
  location: string | null;
  url: string | null;
  description: string | null;
  translator_type: string;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  utc_offset: string | null;
  time_zone: string | null;
  geo_enabled: boolean | null;
  lang: string | null;
  contributors_enabled: boolean;
  is_translator: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url: string;
  default_profile: boolean;
  default_profile_image: boolean;
  following: boolean | null;
  follow_request_sent: boolean | null;
  notifications: boolean | null;
  withheld_in_countries: string[];
}

export interface TwitterMediaSize {
  w: 0;
  h: 0;
  resize: '';
}

export interface TwitterMediaSizes {
  large: TwitterMediaSize;
  thumb: TwitterMediaSize;
  small: TwitterMediaSize;
  medium: TwitterMediaSize;
}

export interface GraphqlMedia {
  display_url: string;
  url: string;
  expanded_url: string;
  id_str: string;
  indices: number[];
  type: string;
  media_url_https: string;
  sizes: TwitterMediaSizes;
}

export interface GraphqlUserMention {
  id_str: string;
  name: string;
  screen_name: string;
  indices: number[];
}

export interface TwitterCustomIngestMedia {
  id: number;
  id_str: string;
  indices: number[];
  media_url: string;
  media_url_https: string;
  url: string;
  display_url: string;
  expanded_url: string;
  type: string;
  sizes: TwitterMediaSizes;
  source_status_id: number;
  source_status_id_str: string;
  source_user_id: number;
  source_user_id_str: string;
}

export interface TwitterCustomIngestUserMention {
  id_str: string;
  id: number;
  name: string;
  screen_name: string;
  indices: number[];
}

export interface TwitterCustomIngestEntities {
  hashtags: string[];
  urls: string[];
  user_mentions: any[];
  symbols: string[];
  media: any[];
}

export interface TwitterCustomIngestExtendedEntities {
  media: TwitterCustomIngestMedia[];
}

export interface TwitterCustomIngestRetweetStatus {
  created_at: string;
  // eslint-disable-next-line no-undef
  id: BigInt;
  id_str: string;
  text: string;
  display_text_range: number[];
  source: string;
  truncated: boolean;
  in_reply_to_status_id: string | null;
  in_reply_to_status_id_str: string | null;
  in_reply_to_user_id: string | null;
  in_reply_to_user_id_str: string | null;
  in_reply_to_screen_name: string | null;
  user: TwitterCustomIngestUser;
  geo: string | null;
  coordinates: string | null;
  place: string | null;
  contributors: string | null;
  is_quote_status: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
  entities: TwitterCustomIngestEntities;
  extended_entities: TwitterCustomIngestExtendedEntities;
  favorited: boolean;
  retweeted: boolean;
  possibly_sensitive: boolean;
  editable: boolean;
  filter_level: string;
  lang: string;
}

interface TwitterSearches {
  name: string;
  id: string;
  tweetCount: number;
  type: string;
  pages: number;
}

export interface TwitterSearchConfig {
  pages: number;
  useLoginToken: string;
  searchType: string;
  id: string;
  tweetCount: number;
}

export interface StaticTwitterSessionCreds {
  secret: string;
  cookie: string;
  crf: string;
}

export interface APIRequestCredsUser {
  authorization: string;
  'content-type': string;
  cookie: string;
  'x-csrf-token': string;
}

export interface APIRequestCredsGuest {
  authorization: string;
  'content-type': string;
  'x-guest-token': string;
}

export interface TwitterConfig {
  'use-log-in-tokens': boolean;
  'guest-bearer-token': GuestBearerToken;
  'log-in-tokens': StaticTwitterSessionCreds[];
  searches: TwitterSearches[];
}

export interface LoggedInSessionHeaders {
  authorization: string;
  'content-type': string;
  cookie: string;
  'x-csrf-token': string;
}
