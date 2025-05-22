import HeuristicForumParser from '../../parsers/HeuristicForumParser';
import { SourceType, SourceTypeEnum } from '../../../lib/parserUtil';
import { sources } from './sources';
import { Parser } from '../../../sources';

export function initialize(): Parser[] {
  const jobs: Parser[] = [];
  for (const key in sources) {
    if (sources.hasOwnProperty(key)) {
      const source: SourceType = {
        description: '',
        isCloudFlare: true,
        name: key,
        type: SourceTypeEnum.FORUM,
        url: sources[key].url,
        expireIn: sources[key].expireIn ? sources[key].expireIn : 600,
        requestOption: sources[key].requestOption ? sources[key].requestOption : {},
      };

      if (sources[key].entryUrl) source.entryUrl = sources[key].entryUrl;

      const parser = new HeuristicForumParser(source, sources[key].backFilledMinutes || 32);
      jobs.push({ parser, source });
    }
  }

  return jobs;
}
