import moment from 'moment';
import { Response } from 'request';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: false,
  name: 'CIFFC Wildfire',
  type: SourceTypeEnum.FORUM,
  url: 'https://api.ciffc.net/',
  entryUrl: '/v1/wildfires?page=1',
  requestOption: { method: 'GET' },
};

function formatDate(isoDateString: string): string {
  const date = new Date(isoDateString);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  backFilledTimestamp: number,
  url: string,
  response: Response,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);
  jsondata.rows.forEach((item: any) => {
    const fireId = item.field_agency_fire_id;
    const agency = item.field_agency_code;
    const latitude = item.field_latitude;
    const longitude = item.field_longitude;
    const fireSize = item.field_fire_size;
    const stageOfcontrol = item.field_stage_of_control_status;
    const response = item.field_response_type;
    const fireCause = item.field_system_fire_cause;
    const situationReportDate = formatDate(item.field_situation_report_date);
    const date = formatDate(item.field_status_date);
    const description = `${fireSize}, ${stageOfcontrol}, ${response}, ${fireCause}, ${situationReportDate}`;
    const timestamp = moment(item.field_status_date).unix();

    posts.push(
      new Post(
        `${agency}; ${fireId}; ${latitude}; ${longitude}; ${fireSize}; ${stageOfcontrol}; ${response}; ${fireCause}`,
        {
          current_url: 'https://ciffc.net/national',
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            Title: fireId,
            Description: description,
            Location: `${latitude} ${longitude}`,
            Date: date,
            Entity: '',
            ingestpurpose: 'deepweb',
            parser_type: PARSER_TYPE.AIMLEAP_PARSER,
          }),
        ),
      ),
    );
  });
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'post',
      selector: ['*'],
      handler: postHandler,
    },
  ],
  1440,
);
