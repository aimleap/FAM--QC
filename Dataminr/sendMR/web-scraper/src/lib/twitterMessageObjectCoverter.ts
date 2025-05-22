import {
  convertMediaEntity,
  convertUserEntity,
  LegacyResult,
  parseTwitterTimestamp,
  bigNumberConverter,
  UserResultDetails,
} from './twitterUtils';
import {
  TwitterCustomIngestEntities,
  TwitterCustomIngestExtendedEntities,
  TwitterCustomIngestUser,
} from './twitterInterfaces';

export class TwitterCustomIngestStruct {
  /**
   * This module represents Twitter message
   * extracted from graphql API request.
   * This module also handles message object conversion from graphql format
   * to new custom ingest endpoint format
   */
  created_at: string = '';

  // eslint-disable-next-line no-undef
  id: BigInt = 0n;

  id_str: string = '';

  text: string = '';

  source: string = '';

  truncated: boolean = false;

  in_reply_to_status_id: null = null;

  in_reply_to_status_id_str: string = '';

  in_reply_to_user_id: null = null;

  in_reply_to_user_id_str: string = '';

  in_reply_to_screen_name: string = '';

  user: TwitterCustomIngestUser = {
    id: 0n,
    id_str: '0',
    name: '',
    screen_name: '',
    location: '',
    url: null,
    description: null,
    translator_type: '',
    protected: false,
    verified: false,
    followers_count: 0,
    friends_count: 0,
    listed_count: 0,
    favourites_count: 0,
    statuses_count: 0,
    utc_offset: null,
    time_zone: null,
    geo_enabled: false,
    lang: null,
    contributors_enabled: false,
    is_translator: false,
    profile_background_color: '',
    profile_background_image_url: '',
    profile_background_image_url_https: '',
    profile_background_tile: false,
    profile_link_color: '',
    profile_sidebar_border_color: '',
    profile_sidebar_fill_color: '',
    profile_text_color: '',
    profile_use_background_image: false,
    profile_image_url: '',
    profile_image_url_https: '',
    profile_banner_url: '',
    default_profile: false,
    default_profile_image: false,
    following: null,
    follow_request_sent: null,
    notifications: null,
    withheld_in_countries: [],
  };

  geo: string | null = null;

  coordinates: string | null = null;

  place: string | null = null;

  contributors: string | null = null;

  is_quote_status: boolean = false;

  quote_count: number = 0;

  reply_count: number = 0;

  retweet_count: number = 0;

  favorite_count: number = 0;

  entities: TwitterCustomIngestEntities = {
    hashtags: [],
    urls: [],
    user_mentions: [],
    symbols: [],
    media: [],
  };

  extended_entities: TwitterCustomIngestExtendedEntities = {
    media: [],
  };

  favorited: boolean = false;

  retweeted: boolean = false;

  possibly_sensitive: boolean = false;

  editable: boolean = false;

  filter_level: string = '';

  lang: string = '';

  timestamp_ms: string = '';

  constructor(
    tweetContentObject: LegacyResult,
    tweetUserObject: UserResultDetails,
    postedTimestamp: number,
  ) {
    this.created_at = tweetContentObject.created_at;
    // eslint-disable-next-line no-undef
    this.id = BigInt(bigNumberConverter(tweetContentObject.id_str));
    this.id_str = tweetContentObject.id_str;
    this.text = tweetContentObject.full_text;
    this.source = tweetContentObject.source;
    this.truncated = false; // could not find that field in graph ql response
    this.in_reply_to_status_id = null; // could not find that field in graph ql
    this.in_reply_to_status_id_str = tweetContentObject.in_reply_to_status_id_str;
    this.in_reply_to_user_id = null;
    this.in_reply_to_user_id_str = tweetContentObject.in_reply_to_user_id_str;
    this.in_reply_to_screen_name = tweetContentObject.in_reply_to_screen_name;
    /**
     * user block
     */
    this.user = {
      // eslint-disable-next-line no-undef
      id: BigInt(bigNumberConverter(tweetUserObject.rest_id)),
      id_str: tweetUserObject.rest_id,
      name: tweetUserObject.legacy.name,
      screen_name: tweetUserObject.legacy.screen_name,
      location: tweetUserObject.legacy.location,
      url: null, // could not find this field in graph ql response
      description: tweetUserObject.legacy.description,
      translator_type: tweetUserObject.legacy.translator_type,
      protected: tweetUserObject.legacy.protected,
      verified: tweetUserObject.legacy.verified,
      followers_count: tweetUserObject.legacy.followers_count,
      friends_count: tweetUserObject.legacy.friends_count,
      listed_count: tweetUserObject.legacy.listed_count,
      favourites_count: tweetUserObject.legacy.favourites_count,
      statuses_count: tweetUserObject.legacy.statuses_count,
      utc_offset: null,
      time_zone: null,
      geo_enabled: false,
      lang: null,
      contributors_enabled: false,
      is_translator: tweetUserObject.legacy.is_translator,
      profile_background_color: '', // could not find this field in graph ql response
      profile_background_image_url: '',
      profile_background_image_url_https: '',
      profile_image_url: '', // could not find this field in graph ql response
      profile_image_url_https: tweetUserObject.legacy.profile_image_url_https,
      profile_background_tile: false, // could not find this field in graph ql response
      profile_link_color: '', // could not find this field in graph ql response
      profile_sidebar_border_color: '',
      profile_sidebar_fill_color: '',
      profile_text_color: '',
      profile_use_background_image: false,
      profile_banner_url: '',
      default_profile: tweetUserObject.legacy.default_profile,
      default_profile_image: tweetUserObject.legacy.default_profile_image,
      following: tweetUserObject.legacy.following,
      follow_request_sent: tweetUserObject.legacy.follow_request_sent,
      notifications: tweetUserObject.legacy.notifications,
      withheld_in_countries: tweetUserObject.legacy.witheld_in_countries,
    };
    this.is_quote_status = tweetContentObject.is_quote_status;
    this.quote_count = tweetContentObject.quote_count;
    this.reply_count = tweetContentObject.reply_count;
    this.retweet_count = tweetContentObject.retweet_count;
    this.favorite_count = tweetContentObject.favorite_count;
    const { entities } = tweetContentObject;
    // check to make sure the entity data is available
    // toDO put media from extended_entities to entities (we look at entities.media first in the pipeline)
    // const entityMedia = entities !== undefined ? entities.media : [];
    const symbols = entities !== undefined ? entities.symbols : [];
    const userMentions = entities !== undefined ? entities.user_mentions : [];
    const urls = entities !== undefined ? entities.urls : [];
    const hashtags = entities !== undefined ? entities.hashtags : [];
    const extendedEntities = tweetContentObject.extended_entities;
    const extendedMedia = extendedEntities !== undefined ? extendedEntities.media : [];
    this.entities = {
      hashtags,
      urls,
      user_mentions: convertUserEntity(userMentions),
      symbols,
      media: convertMediaEntity(extendedMedia, tweetContentObject.id_str, tweetUserObject.rest_id),
    };
    this.extended_entities = {
      media: convertMediaEntity(extendedMedia, tweetContentObject.id_str, tweetUserObject.rest_id),
    };
    this.favorited = tweetContentObject.favorited;
    this.retweeted = tweetContentObject.retweeted;
    this.possibly_sensitive = tweetContentObject.possibly_sensitive;
    // this.edit_history = graphQlTweetData.content.itemContent.tweet_results.result.legacy.edit_history;
    // this.edit_controls = graphQlTweetData.content.itemContent.tweet_results.result.legacy.edit_control;
    this.editable = false; // could not find that field in graphql response
    this.filter_level = 'graphql';
    this.lang = tweetContentObject.lang;
    this.timestamp_ms = parseTwitterTimestamp(
      tweetContentObject.id_str,
      postedTimestamp.toString(),
    );
  }
}
