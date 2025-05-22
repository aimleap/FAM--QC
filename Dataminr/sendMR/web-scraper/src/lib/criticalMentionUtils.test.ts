import fs from 'fs';
import path from 'path';
import {
  parseConfig,
  buildQuery,
  CriticalMentionStruct,
  criticalMentionMatchableTag,
  setAudience,
  extractLanguageAbbrev,
  transcriptionIndices,
  transcriptionLimit,
} from './criticalMentionUtils';

const loadFile = (fileName: string): any => {
  const file = fs.readFileSync(
    `${path.join(__dirname, './../spiders/sources/EA/CriticalMentions')}/${fileName}`,
  );
  // @ts-ignore
  return JSON.parse(file);
};
const config = loadFile('criticalMentionSampleConfig.json');
// @ts-ignore
const radioSample = loadFile('criticalMentionSampleRadioMessage.json');
// @ts-ignore
const podcastSample = loadFile('criticalMentionSamplePodcastMessage.json');

describe('Testing Critical Mention utils', () => {
  describe('Testing parseConfig function', () => {
    it('parseConfig should return request url in expected format', () => {
      const urls = config.data.map((search: any) => parseConfig(search));
      expect(urls[0]).toStrictEqual(
        'cTV=1&tvNetworks="CSPAN","CSPAN2","CSPAN3","CPAC"&tvChannels=20106&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(urls[1]).toStrictEqual(
        'cTV=1&tvNetworks="CGTN America","Russia Today"&tvChannels=&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(urls[2]).toStrictEqual(
        'cTV=1&tvNetworks=&tvChannels=91232, 8063, 91303, 8002&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(urls[3]).toStrictEqual(
        'cTV=1&tvNetworks=&tvChannels=&radioNetworks=&radioChannels=&tvGenres="News"&radioGenres=&limit=50&page=1',
      );
      expect(urls[4]).toStrictEqual(
        'cRadio=1&tvNetworks=&tvChannels=&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&booleanQuery=(vaccine OR mandate) AND (army OR navy OR "marine corps" OR marines OR "air force" OR "space force" OR military OR "national guard" OR pentagon OR defense)&limit=50&page=1',
      );
      expect(urls[5]).toStrictEqual(
        'exactPhrase=vaccine&tvNetworks=&tvChannels=&radioNetworks="Bloomberg Radio"&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(urls[6]).toStrictEqual(
        'booleanQuery=deal AND NOT commercial AND NOT add&tvNetworks=&tvChannels=&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(urls[7]).toStrictEqual(
        'cTV=1&tvNetworks="5678"&tvChannels=1234&radioNetworks=&radioChannels=&tvGenres="News"&radioGenres=&exactPhrase=test&limit=50&page=1',
      );
    });
  });
  describe('Testing query builder', () => {
    it('Search query should be in proper format', () => {
      const startTime = '2022-02-09 12:02:22';
      const endTime = '2022-02-09 13:02:22';
      const query = buildQuery(startTime, endTime, config.data[0]);
      const queryExtraArgs = buildQuery(startTime, endTime, config.data[8]);
      const queryExtraArgsV2 = buildQuery(startTime, endTime, config.data[9]);
      expect(query).toStrictEqual(
        'https://api.criticalmention.com/allmedia/search?start=2022-02-09%2012:02:22&end=2022-02-09%2013:02:22&cTV=1&tvNetworks=%22CSPAN%22,%22CSPAN2%22,%22CSPAN3%22,%22CPAC%22&tvChannels=20106&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1',
      );
      expect(queryExtraArgs).toStrictEqual(
        'https://api.criticalmention.com/allmedia/search?start=2022-02-09%2012:02:22&end=2022-02-09%2013:02:22&cTV=1&tvNetworks=%22CSPAN%22,%22CSPAN2%22,%22CSPAN3%22,%22CPAC%22&tvChannels=20106&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1&filterSyndicated=1&licensedOnly=1',
      );
      expect(queryExtraArgsV2).toStrictEqual(
        'https://api.criticalmention.com/allmedia/search?start=2022-02-09%2012:02:22&end=2022-02-09%2013:02:22&cTV=1&tvNetworks=%22CSPAN%22,%22CSPAN2%22,%22CSPAN3%22,%22CPAC%22&tvChannels=20106&radioNetworks=&radioChannels=&tvGenres=&radioGenres=&limit=50&page=1&filterSyndicated=1',
      );
    });
  });
  describe('Testing Matchable Tag builder', () => {
    it('Should return appropriate matchable fields for radio sample', () => {
      const criticalMention = new CriticalMentionStruct(radioSample);
      const matchableTag = criticalMentionMatchableTag(criticalMention);
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('source_type'),
      ).toStrictEqual('radio');
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('source_name'),
      ).toStrictEqual('KPFT-FM');
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('program_title'),
      ).toStrictEqual('KPFT-FM');
    });
  });
  describe('Testing Matchable Tag builder', () => {
    it('Should return appropriate matchable fields for podcast sample', () => {
      const criticalMention = new CriticalMentionStruct(podcastSample);
      const matchableTag = criticalMentionMatchableTag(criticalMention);
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('source_type'),
      ).toStrictEqual('podcast');
      // @ts-ignore
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('source_name'),
      ).toStrictEqual('Sean Castrina');
      expect(
        // @ts-ignore
        matchableTag.get('CRITICAL_MENTION_METADATA')[0].values.get('program_title'),
      ).toStrictEqual('INTERVIEW: Jeremy Slate - Command Your Brand');
    });
  });
  describe('Testing audience setting util method', () => {
    it('ExtraData should not contain alias field', () => {
      const criticalMention = new CriticalMentionStruct(radioSample);
      setAudience(criticalMention, radioSample);
      expect(criticalMention.extraDataMap.has('audience')).toBeFalsy();
    });
    it('ExtraData should contain alias field', () => {
      const criticalMention = new CriticalMentionStruct(podcastSample);
      setAudience(criticalMention, podcastSample);
      expect(criticalMention.extraDataMap.has('audience')).toBeTruthy();
      expect(criticalMention.extraDataMap.get('audience')).toStrictEqual('42,000');
    });
  });
  describe('Testing language abbreviation generator', () => {
    it('Should generate correct abbreviations', () => {
      const lang1 = 'English';
      const lang2 = 'Spanish';
      const abbreviation1 = extractLanguageAbbrev(lang1);
      const abbreviation2 = extractLanguageAbbrev(lang2);
      expect(abbreviation1).toStrictEqual('en');
      expect(abbreviation2).toStrictEqual('es');
    });
  });
  describe('Testing random transcription assigner logic', () => {
    it('Should randomly assign transcription jobs', () => {
      const mockJobs = [{ job: 1 }, { job: 2 }, { job: 3 }, { job: 4 }, { job: 6 }, { job: 7 }];
      const treatment = 20;
      const maxTranscriptions = transcriptionLimit(mockJobs.length, treatment);
      const transcriptionIndexes = transcriptionIndices(mockJobs, maxTranscriptions);
      expect([...new Set(transcriptionIndexes)].length).toStrictEqual(3);
    });
  });
});
