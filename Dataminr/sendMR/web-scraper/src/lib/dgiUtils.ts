import moment from 'moment-timezone';
import striptags from 'striptags';
import { Response } from 'request';
import xml2js from 'xml2js';
import util from 'util';
import Parser from 'rss-parser';
// @ts-ignore
import Logger from './logger';
import Post from '../schema/post';
import { getContext } from './logging/context';

export interface dgiConfig {
  [index: string]: {
    extra_data?: string;
    frequency?: string;
    name: string;
    type: string;
    text_mapping?: string;
    link_mapping: string;
    timestamp_mapping?: string;
    timezone?: string;
    ingest_frequency?: string;
  };
}

export function parseReturnFields(attribute: string | undefined, splitKey: string): string[] {
  return attribute ? attribute.split(splitKey) : [];
}

export function iterateMapping(mapping: string, item: any): string {
  const mappingStr = mapping.trim();
  let newElement = '';

  if (item.hasOwnProperty(mappingStr)) {
    newElement = item[mappingStr];
  } else {
    newElement = `no field named ${mapping}`;
  }

  // In case the last element has an extra attribute
  return newElement;
}

export function getCustomTextElements(messageTemp: string): string[] {
  // Always bring in description
  const fields = ['description'];
  const elementChar = '<';
  const rawTextList = messageTemp.split(' ');

  if (rawTextList.length > 0) {
    for (const i in rawTextList) {
      if (rawTextList[i].includes(elementChar)) {
        // Then we need to put this through iterateMapping
        const itemElementList = rawTextList[i].split('<');

        if (itemElementList.length > 1) {
          const itemElement = itemElementList[1].split('>');

          if (!fields.includes(itemElement[0])) fields.push(itemElement[0]);
        }
      }
    }
  }

  return fields;
}

export function mapTextElements(messageTemplate: string, item: any): string {
  let postText = '';
  const elementCharFwd = '<';
  const elementCharBack = '>';

  try {
    if (messageTemplate && messageTemplate.length > 0) {
      const rawTextList = messageTemplate.split(' ');

      if (rawTextList.length > 0) {
        for (const i in rawTextList) {
          if (rawTextList[i].includes(elementCharFwd)) {
            let elementText = '';
            // Then we need to put this through iterateMapping
            const itemElementList = rawTextList[i].split(elementCharFwd);

            if (itemElementList.length > 1) {
              const itemElement = itemElementList[1].split(elementCharBack)[0];

              elementText = iterateMapping(itemElement, item);

              if (elementText) {
                postText = `${postText} ${elementText}`;
              }
            }
          } else {
            postText = `${postText} ${rawTextList[i]}`;
          }
        }
      }
    } else {
      // If nothing in text mapping, then use title + description
      postText = typeof item.description !== 'undefined' ? `${item.title} ${item.description}` : item.title;
    }
  } catch (ex) {
    Logger.info(
      `Error in textmapping for link ${item.link}. Error is ${ex}.`,
      getContext(0, item.link),
    );
  }
  // Remove HTML tags from text where applicable
  const noHTMLText = striptags(postText.trim());
  if (noHTMLText !== '') {
    // if removing
    return noHTMLText;
  }
  return postText.trim();
}

export function dateFormatter(item: any, key: string, timezone: string): number {
  const val = item[key];
  const euroFormat = 'DD-MM-YYYY HH:mm';
  let unixTime = 0;
  let normCheck = false;
  let euroCheck = false;
  let normFlex = false;

  if (val !== undefined && val != null) {
    normCheck = moment(val.toString(), true).isValid();
    normFlex = moment(val.toString()).isValid();
    euroCheck = moment(val.toString(), euroFormat, true).isValid();
  }
  const timezoneTrimmed = timezone.trim();
  if (normCheck) {
    if (timezoneTrimmed.length > 0) {
      unixTime = moment.tz(val, timezoneTrimmed).utc().unix();
    } else {
      unixTime = moment(val, true).utc().unix();
    }
  }
  if (euroCheck) {
    if (timezoneTrimmed.length > 0) {
      unixTime = moment.tz(val, euroFormat, timezoneTrimmed).utc().unix();
    } else {
      unixTime = moment(val, euroFormat, true).utc().unix();
    }
  }
  if (normFlex) {
    if (timezoneTrimmed.length > 0) {
      unixTime = moment.tz(val, timezoneTrimmed).utc().unix();
    } else {
      unixTime = moment(val).utc().unix();
    }
  }
  return unixTime;
}

export interface redirectObj {
  url: string;
  redirect: boolean;
  status: string;
  redirectUrl: string;
}

// URL Redirecting now being done in pipeline
/* export async function getRedirectedUrl(itemLink: string): Promise<string> {
  const url = itemLink;

  const options = {
    max_redirect_length: 5,
    request_timeout: 3000,
    ignoreSsslErrors: true,
  };

  const getUrl = async (str: string) => {
    const promiseResults = await followRedirect.startFollowing(str, options);

    return promiseResults.length > 0 && promiseResults[0].redirect
      ? promiseResults[0].redirectUrl
      : '';
  };

  return getUrl(url);
} */

export function getDateElement(item: any, mapping: string, timezone: string): number {
  let dateStr = '';

  if (mapping !== 'pubDate' && mapping.length > 0 && item.hasOwnProperty(mapping)) {
    dateStr = mapping;
  } else if (item.hasOwnProperty('pubDate')) {
    dateStr = 'pubDate';
  } else {
    for (const key of Object.keys(item)) {
      // Check to see if an actual date came back
      const numTimestamp = dateFormatter(item, key, timezone);

      if (numTimestamp > 0) return numTimestamp;
    }
  }

  return dateFormatter(item, dateStr, timezone);
}

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export async function getRSSContent(
  response: Response,
  msgTemplate: string,
  sourceUrl: string,
): Promise<JSONValue> {
  const { body } = response;
  const { headers } = response;
  if (response.statusCode !== 200 || headers === undefined || body === undefined) {
    return {};
  }

  try {
    xml2js.parseStringPromise = util.promisify(xml2js.parseString);
    const customElements = getCustomTextElements(msgTemplate);

    let parser = new Parser();

    if (customElements && customElements.length > 0) {
      parser = new Parser({
        customFields: {
          item: customElements,
        },
      });
    }

    const feed = await parser.parseString(response.body);
    // Try to get the attribute mapping

    return feed.items;
  } catch (err) {
    Logger.info(
      `In getRSS Content: Failed to parse response body for url ${sourceUrl}. error is: ${err}`,
      getContext(0, sourceUrl),
    );
    return {};
  }
}

export async function itemToPost(
  item: any,
  rssUrl: string,
  extraData: string[],
  textMapping: string,
  forumPaths: string,
  timestampMapping: string,
  timezone: string,
): Promise<Post> {
  // if nothing, then use pubDate. If something, then use that! If 'Auto' use first timestamp you see
  let timeStampExtract = getDateElement(item, timestampMapping.trim(), timezone);
  let itemLink = item.link;

  if (typeof itemLink === 'undefined' || itemLink === '') {
    Logger.info(`couldn't parse url for ${rssUrl}. Setting equal to rssUrl`, getContext(0, rssUrl));
    itemLink = rssUrl;
  }

  // Return nothing if we cant parse the timestamp
  if (timeStampExtract === 0) {
    Logger.info(
      `couldn't parse timestamp for ${rssUrl}. Setting equal to moment.now()`,
      getContext(0, rssUrl),
    );
    timeStampExtract = moment().utc().unix();
    // return new Post();
  }

  // Need to parse out the fields from web-scraping config
  // ** Do some error handling for whether these items actually exist **
  // First, get list of elements to pull from item
  let postText = mapTextElements(textMapping, item);

  if (postText === '') {
    postText = 'Text Undefined';
  }

  const outputMap = new Map();

  // Assign the dict for extraData
  if (extraData.length > 0) {
    Object.values(extraData).forEach((key: any) => {
      const trimKey = key.trim();

      // Only add if value is defined
      if (typeof item[trimKey] !== 'undefined') {
        outputMap.set(trimKey, String(item[trimKey]));
      }
    });
  }

  // Assign rssUrl & linkdedupe  in extraData
  outputMap.set('rssUrl', rssUrl);

  // Change parser type
  outputMap.set('parser_type', 'RSS_PARSER');

  return new Post(
    postText,
    {
      current_url: itemLink.trim(),
      author_name: forumPaths,
      author_url: rssUrl,
    },
    timeStampExtract,
    [],
    [],
    outputMap,
  );
}
