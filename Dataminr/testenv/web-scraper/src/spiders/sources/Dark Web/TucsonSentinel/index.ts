import moment from 'moment';
import { adjustTimezone } from 'scraper-lite/dist/lib/timestampUtil';
import { TIME_ZONE } from 'scraper-lite/dist/constants/timezone';
import _ from 'lodash';
import { PARSER_TYPE } from '../../../../constants/parserType';
import {
  SourceType,
  SourceTypeEnum,
  ThreadType,
} from '../../../../lib/parserUtil';
import AuthParser from '../../../parsers/AuthParser';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'News',
  isCloudFlare: true,
  name: 'Tucson Sentinel',
  type: SourceTypeEnum.FORUM,
  url: 'https://www.tucsonsentinel.com/category/border/',
  requestOption: {
    method: 'POST',
    headers: {
      authority: 'www.tucsonsentinel.com',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-GB,en;q=0.9',
      'cache-control': 'no-cache',
      cookie: 'cf_chl_3=9017905e564565e',
      origin: 'https://www.tucsonsentinel.com',
      pragma: 'no-cache',
      referer:
        'https://www.tucsonsentinel.com/category/border/?__cf_chl_tk=IlVLklYm5LuzkgE4ETlYbftgzTrxfOCMph1D02R72v0-1705521499-0-gaNycGzNDRA',
      'sec-ch-ua':
        '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    },
    body: JSON.stringify({
      '84e5e93997f76d79600464c2465ea802af9d3bf12f11e8c8bc39825f219bc373':
        'dFEzWuK5jjpjRHh4nhWa0Wn198TqaufA1rTwlM_jSUY-1705521499-1-AfVxDD_FLOm4S-Ju382T3gPLNnqlrjk_5qTBVamyCbPUw1EbIZ5ufqGSQ7jcTnqYj0Viu02kvCKHkGJkV8fh_0Tc1GRjZXVUPRbIC32YBwaba2EfKz8lzsjpJrNdNneZVJCXrNzs79WTzp_TyM2rOeDdwn86AuW5hUxGUtv1iq4sWnCzSAMZlGu4FEWslgZ3F-7a8MP3UeWGmIc13RHMw4WHePBIIdmeHkrglnF-9NepW3Jx6KYMseEZK8hmaLjewfZGhoWs-Cyp9Qp755_tZAaPDxlqT6sqaIFgh5vXDtqAntPx2szTnkJe4xHY4OK46lTKShDyvil2llld5ZRsyH8GW-9Pr6hTE1D2GWaeU1v61-mfIoS49TzO9UP92FNe3tZYvTsgpBGtsl6P8VS0P06EIz-kkneJ_Af0hH8Hg87FniSzdrZuzt-0L_1cHIEyLppFKLXOCsHFZE8SMaGKMsJAsu1k-uGUF79_7n52xkR7blwb2cN9SByxB1lnm9EVvtVD2-BOEzZYv7c_b0ftw4S7pg6wmNIu6bqwxmh0uZ7FiXVbjC18PEOm8oYZ4B4VFzjHaNutCbkBd9C9z1AVXypHZiEcAjBP-vRNzGgfK9f3llZPSpRbV99jwbC12SnW0R6ik8Uk7YHx9erwsrvE41hjjSqz7VjyHhM_3xqeYAQM90jX-pPQPkCdxrpa2spNbYf1WeWPNP5qPtNtArluDOwO4ojh9UfcaktEJUhGp6UiFLk7YlDSKOmbSFLPNZEqk3ysT02dqqn_pQCRZRNnopNXQPBQMseesO7UpmGEzrpa5-YjAtxs2q22XM6yJsKgK-HlT62D17j3GPICZv0Hx1LAUnD3bVqJDQXWgojeegtixfMW6HBNC7nUKwGLCbzJF85nls0vjUQI6-9JkK_phbqtD3wpr0Kzsvlqd_MQUYU7lzGduGXZ9CNN4kaI4QKQnzFf0SZXQ-geeDAclto1VpM7VwBVZIa4g5l_Kb32gT4gNw0qEyrJqZue-Y_IfI3avmehjyBsQJSFw4y91ECVR6V-pSPXLlAGaTSnQQTLjqvPKTOLkZV6QR8k6If-WNymOrW_2U72Qpx_8_oKVBCF5ibJeCCb4bGduM7jAIdqadOc4LApxriRG1Wzd1Iaak2czF0J9yUM6o9btTkviYAcAALLvjJPW8TQvGdInF_CSESshYSdaHdCAC9uKJDVqQdXdWIkQftFUqHyY-0zSJ1NImqpbtmxeOD2kcQFerJguDMBE-rR2RpV93PcDMNqX5Jj0M6OSR_Ts-xIyuIQl9SKgeldjXLclD9R9FKL7iSZKvC3cvw9i2E2eYbEDxzlZFDU8o3ig1Hid7jl76iwmAaTmJk226s3VTP8QRG_txmiRmMtUz_0TpLDfbfUnEx4Q9qC235ogYWoFQ9ik2H6nI9VcMjygsGfGrLJTIc5c7Dzba78sYmS9uRy8lI_ejVRMOcDHVxMBASMTukizmO1OZWkxNE8wrSZInqun4UVYYKBKJvgBoa5WF-gL8Be7AXxt3MTUO54pP9iPKmPAInu8KDishzN587exlgaHM4xTt4wEMdp3aGJpIjlonrrPNR8DlXjpru6I15wE6_HyQ3vlB-RpbMkkFEnRl0ROpFCbaLaqrj4SDWiVmRhxN9lWaJEdsSeBQYuzt6n9bt13ACh7vQhf-Qs-JoFSXb65JfriYLzmp1Ra7VfSqJZB6LowAPsZbTPv1BiMr_qxUne4DekBVC0JNXFg2DbsnQSnhyk_xWG_-Rk0YuoS7H0HUGvRbY9jCMOaOd5hqsnTYSYMmKxsCuj0tWGdCZRxs7B0FMMm1YgOZyShqENNKoCVoxaiGaIJ4rVbKt013ZW2ooGy9pQwkeLv2mQJDcuIIgLb5aeq806BkPhpkrXgPeUXvVZYb2982cILwq5F7ZnmHo5GG9iOEgCM--Cgyf9sm9KMlTht82gzDbEPb8x8ru-zexJx1OoBhb8KYadhczCJpn7zJClSM85GOgAgz8ai4VvNRJy0G-iSk0bNkrFh4KHBzeM4S4FMsqFDtUPV28xJcKdj4xQ6pqoqGte6CpcwimXCtNyGaHqqL9pSoc6yC4N7KncJ00A4D6YIq4V-idFcg8DdbHSqk87Q6mNMDFKNDdEJ2jkRsZeEcIkcfC0oM8TxgMsnK0HMKVYV3dQzQ94zaBDsoUVetu4TKm07xuSOuMM9J8oM0A7SQPFm-rW08HsjEl2eUdMbRM0tZQdn9nDa9OdJuEEBAomMdJu1Fy_lkWpfOtfL9wbqf3W5jC_SD9Hu7tOGAjklLlKbaVcd-SR_o8-oCs3v_Nmm2nAvIP-k7c6k2Fr_H6ziNaIwxxi2kUqYlIFH16orKlJMFrJ-VwgsWaJmhjGvcGf4eTcimlgi6449V7ekFZcNEvOpERIdicpgchTp8pql3TxRrFJXd9TnRa1iKdCAkNTzHU5u7HGR6SKPRpCpsBKSyoKMEu-aR7XmGqwB5rDvWWORr-q2uKnpJzI-NRSuVriKwLVTvZ06dooqngv3RKFxL6jDzhR0i3ryRZkG_CSlrm0n1sTrOSiQ8dZPAeYqoshDwG66a6nZ3FcctI8yxhqUG7kwTS44TcZvndM7vk-P8XTTfNqmBwbpAdrRlBBYaCtJqtMp8Dhy-HfYsboxxdre4zfrH4UsMy8cOcM0YLpFpraKjAVA8XX69jpXhevNURUsfMiZX-EKwLEv3kYpN2ZuyCKnrusqK8zkzus-3UEsHXWpvXJZu1cIol9h6gv7ECj5-5G5ngJoB5nEut6TDU1jjVINPY83Ye6YHKMtxo5ajTQTw7Kc-POHtoYVsXTxt8BmfPSoBl4xPynnPMSlPz1JUJTi0EwLZ9mjg_syn54xbIzVovDU7Hl2SjygFJ_O6w2B_vyDd10p-DX20PP0d6BZ86BBaLyq-vPYmtrsPTRHakfPX1pxJkWRWMpUO9sAMRqjTxfnPUY_HvD0EKScfyH2VsAhmpuzrQS3zRSqcaM6WVzjKQdzqp_TY3On1j8HnvPMpDD4UT-hU36FkwrzvZAuNen44o9WoLlkeez4qdwhvqtLwUoydtXmoAI2FigrPqL5ymK7sYwWNwGvth5or1ds4Xg6E6y8-6R7T0nr1nImkSrnOR_wADMRXRPdacFzqwiPnd_-r37SummUHPDlhaR6ZyHhvw_Y6ezgLZRLSelUpwpaeiSIm4v-XS9eYGAmLD1MYso1ZfOfsuDZPlaGOLH5dEOaA5rTb6AHWz4mCfc3zL9_U8z4SfQamN7sRiplUVQ4rA',
      f10c462c80263dec7931eb2765512435ec876e2bfdd1ac49957653205d60c71b:
        '3c2bc8b63a9b5d960931294108852b24',
      dc9f6e224dd1ee52bc83fddcd5bbe030214c178fa85db1228157f48289f39013:
        'uBTpMcOTdpYA-1-84712c1b288e17a4',
    }),
  },
};

async function threadHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
): Promise<ThreadType[]> {
  const threads: ThreadType[] = [];
  elements.forEach((el) => {
    const title = $(el).find('h4 a').attr('title');
    const time = $(el)
      .find('span[class="pubdate columns small-4 medium-3"]')
      .text()
      .trim();
    const timestamp = adjustTimezone(
      moment.utc(time, 'MMM DD, YYYY, hh:mm a').format('YYYY-MM-DD hh:mm A'),
      TIME_ZONE['US/Arizona'],
    );
    const link = `https://www.tucsonsentinel.com${$(el)
      .find('a')
      .attr('href')}`;
    threads.push({
      title,
      link,
      parserName: 'post',
      delay: _.random(15, 30) * 1000,
      timestamp,
    });
  });
  return threads;
}

async function postHandler(
  $: CheerioSelector,
  elements: CheerioElement[],
  forumPaths: string[],
  _backFilledTimestamp: number,
  url: string,
): Promise<Post[]> {
  const posts: Post[] = [];
  const title = $(elements).find('h1').text().trim();
  const articlefulltext = $(elements)
    .find('div[id="article-body-text"]')
    .contents()
    .text()
    .trim()
    .replace(/[\t\n\s]+/g, ' ');
  const time = $(elements)
    .find('span[itemprop="datePublished"]')
    .text()
    .trim()
    .replace('Posted ', '');
  const timestamp = adjustTimezone(
    moment.utc(time, 'MMM DD, YYYY, hh:mm a').format('YYYY-MM-DD hh:mm A'),
    TIME_ZONE['US/Arizona'],
  );
  posts.push(
    new Post(
      articlefulltext,
      {
        current_url: url,
      },
      timestamp,
      [],
      [],
      new Map(
        Object.entries({
          entity: title,
          title,
          articlefulltext,
          ingestpurpose: 'deepweb',
          parser_type: PARSER_TYPE.AIMLEAP_PARSER,
        }),
      ),
    ),
  );
  return posts;
}

export const parser = new AuthParser(
  source,
  [
    {
      name: 'thread',
      selector: ['div[class*="post style3"]'],
      handler: threadHandler,
    },
    {
      name: 'post',
      selector: ['div[id="article-container"]'],
      handler: postHandler,
    },
  ],
  1440,
);
