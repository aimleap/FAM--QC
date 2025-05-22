import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';
import { PARSER_TYPE } from '../../../../constants/parserType';

export const source: SourceType = {
  description: 'Leak Site',
  isCloudFlare: false,
  name: 'Embargo ransomware group',
  type: SourceTypeEnum.FORUM,
  url: 'http://embargobe3n5okxyzqphpmk3moinoap2snz5k6765mvtkk7hhi544jid.onion/api/blog/get',
};

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
  response: any,
): Promise<Post[]> {
  const posts: Post[] = [];
  if (response.statusCode !== 200) return [];
  const jsondata = JSON.parse(response.body);

  jsondata.forEach((item: any) => {
    // eslint-disable-next-line no-underscore-dangle
    const id = item._id;
    const title = item.comname;
    const description = item.descr;
    let comment = item.comments;
    if (comment) {
      comment = `Message ${comment}`;
    }
    const date = item.date_created;
    const link = `http://embargobe3n5okxyzqphpmk3moinoap2snz5k6765mvtkk7hhi544jid.onion/#/post/${
      id}`;
    const timestamp = moment(date).unix();
    const text = `${title};${description};${comment}`;
    const description1 = `${description} ${comment}`;
    posts.push(
      new Post(
        text,
        {
          current_url: link,
        },
        timestamp,
        [],
        [],
        new Map(
          Object.entries({
            entity: title,
            title,
            articlefulltext: description1,
            ingestpurpose: 'darkweb',
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
