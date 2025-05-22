import { Response } from 'request';
import moment from 'moment';
import LiteParser from '../lib/parsers/liteParser';
import { Post, Thread } from '../lib/types';
import { appendLink } from '../lib/parserUtil';

const baseURLPrefix = 'https://biz.chosun.com';
const baseURLSuffix = '/pf/api/v3/content/fetch/story-feed?query=%7B%22excludeContentTypes%22%3A%22gallery%2C%20video%22%2C%22excludeDistributorNames%22%3A%22Stockplus%2CSellymon%2CNews1_WEB%2Cpickcon%22%2C%22excludeSections%22%3A%22%2Fchosunbiz-k%2C%20%2Fcsr%22%2C%22excludeTags%22%3A%22%22%2C%22expandRelated%22%3Atrue%2C%22includeContentTypes%22%3A%22story%22%2C%22includeTags%22%3A%22%22%2C%22offset%22%3A0%2C%22size%22%3A20%7D&filter=%7Bcontent_elements%7B%5B%5D%2C_id%2Ccanonical_url%2Ccredits%7Bby%7B_id%2Cadditional_properties%7Boriginal%7Baffiliations%2Cbyline%7D%7D%2Cname%2Corg%2Curl%7D%7D%2Cdescription%7Bbasic%7D%2Cdisplay_date%2Cheadlines%7Bbasic%2Cmobile%7D%2Clabel%7Bshoulder_title%7Btext%2Curl%7D%7D%2Cpromo_items%7Bbasic%7B_id%2Cadditional_properties%7Bfocal_point%7Bmax%2Cmin%7D%7D%2Calt_text%2Ccaption%2Ccontent_elements%7B_id%2Calignment%2Calt_text%2Ccaption%2Ccontent%2Ccredits%7Baffiliation%7Bname%7D%2Cby%7B_id%2Cbyline%2Cname%2Corg%7D%7D%2Cheight%2CresizedUrls%7B16x9_lg%2C16x9_md%2C16x9_sm%2C16x9_xs%2C16x9_xxl%2C1x1_lg%2C1x1_md%2C1x1_sm%2C1x1_xs%2C1x1_xxl%7D%2Csubtype%2Ctype%2Curl%2Cwidth%7D%2Ccredits%7Baffiliation%7Bbyline%2Cname%7D%2Cby%7Bbyline%2Cname%7D%7D%2Cdescription%7Bbasic%7D%2Cfocal_point%7Bx%2Cy%7D%2Cheadlines%7Bbasic%7D%2Cheight%2Cpromo_items%7Bbasic%7B_id%2Cheight%2CresizedUrls%7B16x9_lg%2C16x9_md%2C16x9_sm%2C16x9_xs%2C16x9_xxl%2C1x1_lg%2C1x1_md%2C1x1_sm%2C1x1_xs%2C1x1_xxl%7D%2Csubtype%2Ctype%2Curl%2Cwidth%7D%7D%2CresizedUrls%7B16x9_lg%2C16x9_md%2C16x9_sm%2C16x9_xs%2C16x9_xxl%2C1x1_lg%2C1x1_md%2C1x1_sm%2C1x1_xs%2C1x1_xxl%7D%2Cstreams%7Bheight%2Cwidth%7D%2Csubtype%2Ctype%2Curl%2Cwebsites%2Cwidth%7D%2Clead_art%7Bduration%2Ctype%7D%7D%2Crelated_content%7Bbasic%7B_id%2Cabsolute_canonical_url%2Cheadlines%7Bbasic%2Cmobile%7D%2Creferent%7Bid%2Ctype%7D%2Ctype%7D%7D%2Csubtype%2Ctaxonomy%7Bprimary_section%7B_id%2Cname%7D%2Ctags%7Bslug%2Ctext%7D%7D%2Ctest%2Ctype%2Cwebsite_url%7D%2Ccount%2Cnext%7D&d=213&_website=chosunbiz';

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  url: string,
  data: string[],
  response: Response,
): Promise<Thread[]> {
  const threads: Thread[] = [];

  const jsonObject = JSON.parse(response.body);
  const jsonArray = jsonObject.content_elements;
  jsonArray.forEach((jObj: any) => {
    const articlePublishedDate = jObj.display_date;
    const formattedDate = articlePublishedDate.split('T')[0];
    const date = moment(formattedDate, 'YYYY-MM-DD').format('MM/DD/YYYY');
    if (moment(date, 'MM/DD/YYYY').isSame(moment(), 'day')) {
      const href = jObj.canonical_url;
      const headline = jObj.description.basic;
      threads.push({
        link: `${baseURLPrefix}${href}`,
        title: `${headline}`,
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
  data: string[],
): Promise<Post[]> {
  const posts: Post[] = [];
  if (url === appendLink(baseURLPrefix, baseURLSuffix)) {
    return posts;
  }

  const scriptTagText = $(elements).find('script[id="fusion-metadata"]').get()[0].children[0].data;
  const formattedScript = scriptTagText.split(';Fusion.globalContentConfig')[0];
  const finalScript = formattedScript.split('Fusion.globalContent=')[1];
  const jsonObject = JSON.parse(finalScript);
  const headline = jsonObject.headlines.basic;
  const dateText = jsonObject.display_date;
  const date = dateText.split('T')[0];
  const description = data[0];
  let text = '';
  const jsonArray = jsonObject.content_elements;
  jsonArray.forEach((jObj: any) => {
    if (jObj.hasOwnProperty('content')) {
      const { content } = jObj;
      text = text.concat(' ', content);
    }
    return text;
  });

  const timestamp = moment(date, 'YYYY-MM-DD').unix();
  const textInfo = `${headline} , ${description}`;
  const extraDataInfo = {
    text,
  };

  posts.push(
    new Post({
      text: textInfo,
      postUrl: url,
      postedAt: timestamp,
      extraData: extraDataInfo,
    }),
  );
  return posts;
}

export const parser = new LiteParser(
  'Chosun Biz',
  baseURLPrefix,
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
  baseURLSuffix,
);
