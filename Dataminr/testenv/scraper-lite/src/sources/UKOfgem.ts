import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const json = JSON.parse(response.body);
  const jsonArray = json.data;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = moment(jObj.attributes.field_published, 'YYYY-MM-DD');
    if (articlePublishedDate.isSame(moment(), 'day')) {
      const href = jObj.attributes.path.alias;
      const headline = jObj.attributes.title;
      threads.push({
        link: href,
        title: headline,
        parserName: 'post',
      });
    }
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];

  if (url.includes('https://www.ofgem.gov.uk/jsonapi/index/publications')) {
    return posts;
  }
  const $el = $(elements);
  const title = $el.find('#block-entityviewcontent h1').text().replace(/\n+/g, '').trim();
  const description = $el
    .find('.layout-content .c-wysiwyg')
    .text()
    .substr(0, 200)
    .replace(/\n+/g, '')
    .trim();
  const fullText = $el.find('.layout-content .c-wysiwyg').text().replace(/\n+/g, '').trim();
  const publicationDate = $el.find('.layout-content time').text().replace(/\n+/g, '').trim();
  const entitiesSource = 'UK Ofgem';
  const industrySector = $el
    .find('.layout-content div>h3:contains(Industry sector)+div')
    .text()
    .replace(/\n+/g, '')
    .trim();
  const timestamp = moment(publicationDate, 'DD MMMM YYYY').unix();
  const pressReleaseInfo = `Title: ${title}, Description: ${description}, Date: ${publicationDate}, Entities (source): ${entitiesSource}, Type: ${industrySector}`;
  posts.push(
    new Post({
      text: pressReleaseInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: {
        Title: title,
        Description: description,
        Date: publicationDate,
        'Entities (source)': entitiesSource,
        Type: industrySector,
        'Additional Data': fullText,
      },
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'UK Ofgem',
  'https://www.ofgem.gov.uk',
  [
    {
      selector: ['*'],
      parser: threadHandler,
    },
    {
      selector: ['body'],
      parser: postHandler,
      name: 'post',
    },
  ],
  '/jsonapi/index/publications?page[limit]=39&filter[type_prefilter-filter][condition][path]=type_prefilter&filter[type_prefilter-filter][condition][operator]=IN&filter[type_prefilter-filter][condition][value][]=publication&filter[field_case_publication_type_prefilter-filter][condition][path]=field_case_publication_type_prefilter&filter[field_case_publication_type_prefilter-filter][condition][operator]=IN&filter[field_case_publication_type_prefilter-filter][condition][value][]=1614&filter[uuid-filter][condition][path]=uuid&filter[uuid-filter][condition][operator]=NOT%20IN&filter[uuid-filter][condition][value][]=ffd97db7-9a63-425d-b144-607e351700db&filter[uuid-filter][condition][path]=uuid&filter[uuid-filter][condition][operator]=NOT%20IN&filter[uuid-filter][condition][value][]=91a00fce-07f8-4be5-a093-1a3156f7dc2e&filter[uuid-filter][condition][path]=uuid&filter[uuid-filter][condition][operator]=NOT%20IN&filter[uuid-filter][condition][value][]=e944bbe9-0762-440a-a082-4b907ce58d1d&filter[uuid-filter][condition][path]=uuid&filter[uuid-filter][condition][operator]=NOT%20IN&filter[uuid-filter][condition][value][]=f2207a94-0116-42d2-89a8-2cc96fa51d1d&sort[published][path]=field_published&sort[published][direction]=desc&fields[node--publication]=path,title,sticky,field_teaser_summary,field_teaser_image,field_published,field_closing_date,field_closed_date,field_investigation_status,field_status,field_provisional_order_status,field_call_for_input_status,field_final_order_status,field_proposal_status,field_industry_sector,field_case_type,field_publication_type,field_licence_sector,field_electricity_license_code,field_gas_license_code,field_scheme_name&include=field_investigation_status,field_status,field_provisional_order_status,field_call_for_input_status,field_final_order_status,field_proposal_status,field_industry_sector,field_case_type,field_publication_type,field_licence_sector,field_electricity_license_code,field_gas_license_code,field_scheme_name&filter[langcode]=en',
);
