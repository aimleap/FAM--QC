import fs from 'fs';
import path from 'path';
// @ts-ignore
import * as bigJson from 'json-bigint';
import dayjs from 'dayjs';
import {
  parseThreadHandlerSearchConfig,
  parseTwitterTimestamp,
  bigNumberConverter,
  TwitterResponse,
} from './twitterUtils';
import { source } from '../spiders/sources/EA/Twitter';
import { TwitterCustomIngestStruct } from './twitterMessageObjectCoverter';

describe('Testing Twitter utility methods', () => {
  describe('Test Twitter statusId converter', () => {
    it('it should pass', () => {
      const sampleStatusId = '1599205091294052352';
      const sampleUserId = '20796069';
      const convertedStatusId = bigNumberConverter(sampleStatusId);
      const convertedUserId = bigNumberConverter(sampleUserId);
      expect(convertedStatusId).toEqual(1599205091294052352);
      expect(convertedUserId).toEqual(20796069);
      // test json parsing for bigInts
      // eslint-disable-next-line no-undef
      const statusIdBigInt: BigInt = BigInt(convertedStatusId);
      const obj = {
        id: convertedUserId,
        bigId: statusIdBigInt,
      };
      const jsonObj = bigJson.stringify(obj);
      const parsedJson = JSON.parse(jsonObj);
      const { bigId } = parsedJson;
      expect(bigId).toEqual(1599205091294052352);
    });
  });
  describe('Test Twitter timestamp parsing', () => {
    it('it should pass', () => {
      const sampleStatusId = '1594695762440511488';
      const parsedTimestamp = parseTwitterTimestamp(sampleStatusId, '');
      const parsedDateTime = parseTwitterTimestamp(sampleStatusId, '', false);
      expect(parsedDateTime).toEqual('Mon Nov 21 14:14:32:437 +0000 2022');
      expect(parsedTimestamp).toEqual('1669040072437');
    });
  });
  describe('Test Thread handler title', () => {
    it('it should pass', () => {
      const id = '123';
      const tweetCount = 200;
      const pages = 5;
      const useLogInTokens = false;
      const type = 'handle';
      const title: string[] = [
        `${id}__${tweetCount}__pages=${pages}__useLoginTokens=${useLogInTokens}__type=${type}`,
      ];
      const parsedConfig = parseThreadHandlerSearchConfig(title);
      expect(parsedConfig.pages).toEqual(5);
      expect(parsedConfig.id).toEqual('123');
      expect(parsedConfig.tweetCount).toEqual(200);
      expect(parsedConfig.useLoginToken).toEqual('false');
      expect(parsedConfig.searchType).toEqual('handle');
    });
  });
  describe('Test raw graphql user message parsing', () => {
    it('it should pass', () => {
      const sampleTwitterUserMessage = fs.readFileSync(
        `${path.join(__dirname, './../spiders/sources/EA/Twitter')}/twitterGraphglUserSample.json`,
      );
      // @ts-ignore
      const userRawObject: TwitterResponse = JSON.parse(sampleTwitterUserMessage);
      const userEntries = userRawObject.data.user.result.timeline_v2.timeline.instructions.filter(
        (f) => f.type === 'TimelineAddEntries',
      )[0];
      expect(userEntries.entries.length).toBeGreaterThan(0);
      const cursorArray: string[] = [];
      userEntries.entries.forEach((entry) => {
        const cursorId = entry.entryId.startsWith('cursor') ? entry.content.value : '0';
        if (cursorId !== '0') cursorArray.push(cursorId);
      });
      expect(cursorArray.length).toEqual(2);
      expect(cursorArray).toContain('HBaCgNDNn9+2kiwAAA==');
      expect(cursorArray).toContain('HCaAgIDUhbnmoCwAAA==');
      const sampleTweetObject = userEntries.entries[0];
      const tweetContentObject = sampleTweetObject.content.itemContent.tweet_results.result.legacy;
      const tweetUserObject = sampleTweetObject.content.itemContent.tweet_results.result.core.user_results.result;
      const text = tweetContentObject.full_text;
      const url = `${source.url}${tweetUserObject.legacy.screen_name}/status/${tweetContentObject.id_str}`;
      const authorName = tweetUserObject.legacy.screen_name;
      const authorUrl = `${source.url}${tweetUserObject.legacy.screen_name}`;
      expect(text.startsWith('Russian Navy Morse code weather')).toBeTruthy();
      expect(authorName).toEqual('te3ej');
      expect(authorUrl).toEqual('https://twitter.com/te3ej');
      expect(url).toEqual('https://twitter.com/te3ej/status/1594262683251281926');
    });
  });
  describe('Test raw graphql list message parsing', () => {
    it('it should pass', () => {
      const sampleTwitterListMessage = fs.readFileSync(
        `${path.join(__dirname, './../spiders/sources/EA/Twitter')}/twitterGraphglListSample.json`,
      );
      // @ts-ignore
      const listRawObject: TwitterResponse = JSON.parse(sampleTwitterListMessage);
      const listEntries = listRawObject.data.list.tweets_timeline.timeline.instructions.filter(
        (f) => f.type === 'TimelineAddEntries',
      )[0];
      expect(listEntries.entries.length).toBeGreaterThan(0);
      const cursorArray: string[] = [];
      listEntries.entries.forEach((entry) => {
        const cursorId = entry.entryId.startsWith('cursor') ? entry.content.value : '0';
        if (cursorId !== '0') cursorArray.push(cursorId);
      });
      expect(cursorArray.length).toEqual(2);
      expect(cursorArray).toContain('HCaAgLPRmda/oSwAAA==');
      expect(cursorArray).toContain('HBaAwKr16PLYoCwAAA==');
      const sampleTweetObject = listEntries.entries[0];
      const tweetContentObject = sampleTweetObject.content.itemContent.tweet_results.result.legacy;
      const tweetUserObject = sampleTweetObject.content.itemContent.tweet_results.result.core.user_results.result;
      const fullConvertedMessageObject = new TwitterCustomIngestStruct(
        tweetContentObject,
        tweetUserObject,
        dayjs().valueOf(),
      );
      const fullMessageObjectStringified = bigJson.stringify(fullConvertedMessageObject);
      const fullMessageObjectParsed: TwitterCustomIngestStruct = JSON.parse(
        fullMessageObjectStringified,
      );
      const text = tweetContentObject.full_text;
      const url = `${source.url}${tweetUserObject.legacy.screen_name}/status/${tweetContentObject.id_str}`;
      const authorName = tweetUserObject.legacy.screen_name;
      const authorUrl = `${source.url}${tweetUserObject.legacy.screen_name}`;
      expect(text.startsWith('Important debate with the #NATO Parliamentary')).toBeTruthy();
      expect(authorName).toEqual('jensstoltenberg');
      expect(authorUrl).toEqual('https://twitter.com/jensstoltenberg');
      expect(url).toEqual('https://twitter.com/jensstoltenberg/status/1594695762440511488');
      expect(fullMessageObjectParsed.id).toEqual(1594695762440511488);
      expect(fullMessageObjectParsed.created_at).toEqual('Mon Nov 21 14:14:32 +0000 2022');
    });
  });
});
