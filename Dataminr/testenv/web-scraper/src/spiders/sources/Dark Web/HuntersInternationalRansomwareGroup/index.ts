import { Response } from 'request';
import moment from 'moment';
import _ from 'lodash';
import { PARSER_TYPE } from '../../../../constants/parserType';
import { SourceType, SourceTypeEnum, ThreadType } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import AuthParser from '../../../parsers/AuthParser';

export const source: SourceType = {
  description: 'leak site',
  isCloudFlare: true,
  name: 'Hunters International Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'https://hunters55rdxciehoqzwv7vgyv6nt37tbwax2reroyzxhou7my5ejyid.onion/api/public/companies',
  requestOption: {
    strictSSL: false,
    rejectUnauthorized: false,
    headers: {
      authority: 'hunters55rdxciehoqzwv7vgyv6nt37tbwax2reroyzxhou7my5ejyid.onion',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US;q=0.5,en;q=0.3',
      'content-type': 'application/json',
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
  },
};

interface Company {
  id: string;
  title: string;
  revenue: number;
  employees: number;
  country: string;
  stocks: string[];
  website: string;
  exfiltrated_data: boolean;
  encrypted_data: boolean;
  updated_at: number;
}

interface DisclosedFile {
  name: string;
  path: string;
  size: number;
}

interface Disclosure {
  id: string;
  company_id: string;
  title: string;
  description: string;
  total_files: number;
  total_size: number;
  dirs: string[];
  files: DisclosedFile[];
  status: string;
  created_at: number;
  updated_at: number;
}

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],

  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<ThreadType[]> {
  if (response.statusCode !== 200) return [];
  const companies: Company[] | null = JSON.parse(response.body);
  if (!companies) return [];
  const uniqueTitles = new Set<string>();
  const threads = companies.reduce((acc: ThreadType[], company: Company) => {
    const title = `${company.title}_${company.id}`;
    if (!uniqueTitles.has(title)) {
      uniqueTitles.add(title);
      acc.push({
        title,
        link: `https://hunters55rdxciehoqzwv7vgyv6nt37tbwax2reroyzxhou7my5ejyid.onion/api/public/companies/${company.id}/disclosures`,
        parserName: 'post',
        timestamp: moment().unix(),
        delay: _.random(5, 10) * 1000,
      });
    }
    return acc;
  }, []);
  return threads;
}

function formatText(company: string): string {
  return company;
}

async function postHandler(
  _$: CheerioSelector,
  _elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  if (response.statusCode !== 200) return [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [company, __] = forumPaths[0].split('_');
  const disclosures: Disclosure[] | null = JSON.parse(response.body);
  if (!disclosures) return [];
  return disclosures.map(
    (disclosure: Disclosure) => new Post(
      formatText(company),
      {
        current_url: `http://hunters55rdxciehoqzwv7vgyv6nt37tbwax2reroyzxhou7my5ejyid.onion/companies/${disclosure.company_id}`,
      },
      disclosure.created_at,
      [],
      [],
      new Map(
        Object.entries({
          entity: company,
          isPublished: disclosure.status === 'published',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['*'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
