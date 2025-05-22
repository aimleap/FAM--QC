import querystring from 'querystring';
import moment from 'moment';
// eslint-disable-next-line import/no-extraneous-dependencies
import ISO6391 from 'iso-639-1';
import { TagV2 } from '../schema/post';
import Logger from './logger';
import Whisper from './api/Whisper';

export interface CriticalMentionJobSpecs {
  transcription: string;
  query: string;
  source: string;
}

export interface CriticalMentionConfigUI {
  sessionToken: string;
  data: any[];
}

export interface CmConfig {
  queryNumber: string;
  query: string;
  queryParamName: string;
  duration: number;
  pageSize: number;
  tvChannels: string;
  radioChannels: string;
  tvNetworks: string;
  radioNetworks: string;
  'radio-genre': string;
  'tv-genre': string;
  broadcastType: string;
  extraParams: string[];
  transcribe: boolean;
  treatment: number;
}

// eslint-disable-next-line no-shadow
export enum CmSourceName {
  SOURCE_ABBREVIATION = 'cm',
}

// eslint-disable-next-line no-shadow
enum CmMediaTypes {
  TV = 'mp4',
  podcast = 'ts',
  RADIO = 'mp3',
}

function process(input: string): string {
  if (input === undefined) return '';
  return `"${input.split(', ').join('","')}"`.trim();
}

function processChannels(input: string): string {
  if (input === undefined) return '';
  // eslint-disable-next-line radix
  return `${input.trim()}`;
}

function extraParameters(config: CmConfig): string | null {
  if (config.extraParams === undefined || config.extraParams.length === 0) return null;
  // additional query parameters in format like [param1=value,param2=value,param3=value]
  return config.extraParams.join('&');
}

export function parseConfig(config: CmConfig): string {
  const tvNetworks = process(config.tvNetworks);
  const tvChannels = processChannels(config.tvChannels);
  const radioNetworks = process(config.radioNetworks);
  const radioChannels = processChannels(config.radioChannels);
  const tvGenre = process(config['tv-genre']);
  const radioGenre = process(config['radio-genre']);
  const queryType = config.queryParamName;
  const limit = config.pageSize;
  const query = config.query.replace(/'/g, '"');
  /*
  - sample url 1: &tvNetworks="BBC","CNBC"&tvChannels=&radioNetworks=&radioChannels=&tvGenre=News&radioGenre=
  - sample url 2: &tvNetworks=&tvChannels=&radioNetworks="BBC"&radioChannels=&tvGenre=&radioGenre=News
   */

  const neworksQuery = querystring
    .unescape(
      querystring.stringify(
        {
          tvNetworks,
          tvChannels,
          radioNetworks,
          radioChannels,
          tvGenres: tvGenre,
          radioGenres: radioGenre,
        },
        '&',
        '=',
      ),
    )
    .replace(/=''/g, '=')
    .replace(/=""/g, '=');

  // dataType can either be cTV=1, cRadio=1 or ""
  const dataType = config.broadcastType === undefined
    || config.broadcastType === 'ALL'
    || config.broadcastType === 'PODCAST'
    ? ''
    : config.broadcastType;

  if (dataType === '' && queryType === '') return `${neworksQuery}&limit=${limit}&page=1`;
  if (dataType !== '' && queryType === '') return `${dataType}&${neworksQuery}&limit=${limit}&page=1`;
  if (dataType === '' && queryType !== '') return `${queryType}=${query}&${neworksQuery}&limit=${limit}&page=1`;
  return `${dataType}&${neworksQuery}&${queryType}=${query}&limit=${limit}&page=1`;
}

export const buildQuery = (startTime: string, endTime: string, search: CmConfig): string => {
  const baseUrl = 'https://api.criticalmention.com/allmedia/search?';

  const timeFilter = querystring.unescape(
    querystring.stringify(
      {
        start: startTime,
        end: endTime,
      },
      '&',
    ),
  );
  // apply secondary parameters if necessary
  const searchUrl = extraParameters(search) === null
    ? parseConfig(search)
    : `${parseConfig(search)}&${extraParameters(search)}`;

  return encodeURI(`${baseUrl}${timeFilter}&${searchUrl}`);
};

export class CriticalMentionStruct {
  mimeType: string = '';

  sourceType: string = '';

  callSign: string = '';

  alias: string = '';

  author: string = ''; // podcast specific

  matchedKeywords: string = '';

  text: string = '';

  uuid: string = '';

  timestamp: number;

  link: string = '';

  legacyLink: string = '';

  media: string = ''; // if alias is podcast this is where the ts media file url is

  thumbnail: string = '';

  language: string = '';

  sourceName: string = '';

  programTitle: string = '';

  marketCountry: string = '';

  location: string = '';

  state: string = '';

  genre: string = '';

  affiliate: string = '';

  broadcastCoverage: string = '';

  public extraDataMap = new Map();

  constructor(data: any) {
    this.mimeType = data.mimeType.replace('/', '-');
    this.callSign = data.callSign;
    this.sourceType = data.sourceType;
    this.alias = data.alias;
    this.author = data.author;
    this.matchedKeywords = data.ccTextHiWords;
    this.text = data.ccText;
    this.uuid = data.uuid;
    this.timestamp = moment.utc(data.timestamp, 'YYYYMMDDHHmmss').unix();
    this.link = data.mediaUrl;
    this.legacyLink = data.legacyMedia
      ? data.legacyMedia.replace('http', 'https')
      : data.legacyMedia;
    this.media = data.media;
    this.thumbnail = data.thumbnail;
    this.language = data.language;
    this.sourceName = data.alias === 'podcast' ? data.author : data.callSign;
    this.programTitle = data.title;
    this.marketCountry = data.marketCountry;
    this.location = data.marketName;
    this.state = data.marketState;
    this.genre = data.genre;
    this.affiliate = data.affiliate;
    this.broadcastCoverage = data.marketLocal;
    this.initializeExtraData();
  }

  initializeExtraData() {
    this.extraDataMap
      .set('contentType', this.alias)
      .set('sourceType', this.sourceType)
      .set('matchedKeywords', this.matchedKeywords)
      .set('postTimestamp', this.timestamp)
      .set('postLanguage', this.language)
      .set('programTitle', this.programTitle)
      .set('fileType', this.mimeType)
      .set('sourceName', this.sourceName)
      .set('affiliate', this.affiliate)
      .set('genre', this.genre)
      .set('country', this.marketCountry)
      .set('location', this.location)
      .set('state', this.state)
      .set('messageUUID', this.uuid)
      .set('broadcastCoverage', this.broadcastCoverage)
      .set('thumbnail', this.thumbnail);
  }
}

const criticalMentionTag = (tagValues: Map<string, string>): TagV2[] => [
  {
    flag: 'CRITICAL_MENTION_METADATA',
    values: tagValues,
    displayable: true,
  },
];

export const criticalMentionMatchableTag = (
  criticalMention: CriticalMentionStruct,
): Map<string, TagV2[]> => {
  const tagMap: Map<string, TagV2[]> = new Map();
  const values = new Map();
  // some podcast fields are different from other sources
  const { programTitle } = criticalMention;
  const { sourceName } = criticalMention;
  const sourceType = criticalMention.alias.toLowerCase(); // this indicates whether it's a tv, radio or podcast
  const coverage = criticalMention.alias === 'podcast' ? 'unknown' : criticalMention.broadcastCoverage;
  values
    .set('program_title', programTitle)
    .set('source_name', sourceName)
    .set('source_type', sourceType)
    .set('coverage', coverage)
    .set('genre', criticalMention.genre);
  tagMap.set('CRITICAL_MENTION_METADATA', criticalMentionTag(values));
  return tagMap;
};

export const criticalMentionMediaFormat = (alias: string): string | null => {
  try {
    return CmMediaTypes[alias as keyof typeof CmMediaTypes];
  } catch (e) {
    Logger.warn(`Critical mention alias ${alias} does not correspond with media type`);
    return null;
  }
};
/**
 * Set audience only when incoming message is of type podcast. Otherwise,
 * don't add it to extraData
 * @param struct
 * @param criticalMentionData
 */
export const setAudience = (struct: CriticalMentionStruct, criticalMentionData: any): void => {
  if (struct.alias === 'podcast') {
    struct.extraDataMap.set(
      'audience',
      new Intl.NumberFormat().format(criticalMentionData.audience),
    );
  }
};

export const extractLanguageAbbrev = (language: string): string => ISO6391.getCode(language);

export const tryWhisperTranscribe = async (
  struct: CriticalMentionStruct,
  audioData: string,
  transcriptor: Whisper,
  jobSpecs: CriticalMentionJobSpecs,
): Promise<string> => {
  let { text } = struct;
  if (
    (struct.alias === 'podcast' || struct.alias === 'RADIO')
    && jobSpecs.transcription === 'transcribe=true'
  ) {
    try {
      const languageAbbrev = extractLanguageAbbrev(struct.language);
      const transcribe = await transcriptor.transcribe(audioData, 'mp3', languageAbbrev);
      Logger.info('Parsed Whisper API response', transcribe);
      const transcriptionResult = transcribe.transcriptions[0];
      const transcriptionModelInfo = transcriptionResult === undefined ? '' : transcriptionResult.modelInfo;
      // #toDO: change this after the experiment
      // #toDO temporarily setting Critical Mention text in extraData and replacing it with whisper output
      text = transcriptionResult === undefined ? text : transcriptionResult.text;
      struct.extraDataMap.set('providedTranscription', struct.text);
      struct.extraDataMap.set('transcriptionModelInfo', transcriptionModelInfo);
      struct.extraDataMap.set('query', jobSpecs.query);
    } catch (e) {
      Logger.info('Failed to perform Whisper transcription', e);
    }
  }
  return text;
};

/**
 * Job specs which add any additional requirements for a particular job (eg should transcription
 * be applied to messages from a particular query)
 * @param forumPaths
 * @param index
 * @param transcriptionIndexes
 */
export const criticalMentionJobSpecs = (
  forumPaths: string[],
  index: number,
  transcriptionIndexes: number[],
): CriticalMentionJobSpecs => {
  const [source, transcribe, treatment, query] = forumPaths[0].split('-');
  const doTranscribe = transcriptionIndexes.indexOf(index) !== -1 && transcribe === 'transcribe=true'
    ? transcribe
    : 'transcribe=false';
  Logger.info(
    `Setting specs for Critical Mention job. Transcription treatment: ${treatment}. Transcribe flag: ${transcribe}`,
  );
  return { transcription: doTranscribe, query, source };
};

/**
 * Given set treatment expressed as a % value
 * and number of results from Critical Mention query
 * determine how many results should be transcribed using Whisper
 * @param clipsCount
 * @param treatment
 */
export const transcriptionLimit = (clipsCount: number, treatment: number): number => {
  const maxTranscriptions = (treatment * clipsCount) / 100;
  return Number.isInteger(maxTranscriptions)
    ? Math.floor(maxTranscriptions)
    : Math.ceil(maxTranscriptions);
};

/**
 * Return random clips indices which should be transcribed using Whisper.
 * First we randomly sort clips array which returns individual indices.
 * Then we filter the resulting array and ensure the array length is smaller
 * than the transcription limit
 * @param clips clips array
 * @param limit transcription limit
 */
export const transcriptionIndices = (clips: any[], limit: number): any[] => clips
  .map((_, i) => i)
  .sort(() => Math.random() - 0.5)
  .filter((_, i) => i <= limit);
