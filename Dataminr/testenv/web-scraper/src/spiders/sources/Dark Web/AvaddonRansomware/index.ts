import moment from 'moment';
import AuthParser from '../../../parsers/AuthParser';
import { SourceType, SourceTypeEnum } from '../../../../lib/parserUtil';
import Post from '../../../../schema/post';

export const source: SourceType = {
  description: 'Hacking forums',
  isCloudFlare: false,
  name: 'Avaddon Ransomware Group',
  type: SourceTypeEnum.FORUM,
  url: 'http://avaddongun7rngel.onion/',
};

async function postHandler($: CheerioSelector, elements: CheerioElement[]): Promise<Post[]> {
  const posts: Post[] = [];
  elements.forEach((data) => {
    const $el = $(data);
    const company = $el.find('h3').text().trim();
    const postText = $el.find('div > p').text().trim();
    const companyInfo = $el.find('tbody > tr').text().trim().replace(/\n/g, '');
    const companyAddressInfo = companyInfo.match(/(?<=Address:)(.*)(?=Website)/);
    const companyWebsite = companyInfo.match(/(?<=Website:)(.*)(?=Email)/);
    const companyEmails = companyInfo.match(/(?<=Email:)(.*)(?=Phone)/);
    const companyPhones = companyInfo.match(/(?<=Phone:)(.*)(?=Next)|(?=Published)/);
    const publishedData = companyInfo.match(/(?<=Published data:)(.*)(?=Next)/);

    const compAddress = Array.isArray(companyAddressInfo) && companyAddressInfo.length > 0
      ? companyAddressInfo[0].trim()
      : '';
    const companyWeb = Array.isArray(companyWebsite) && companyWebsite.length > 0 ? companyWebsite[0].trim() : '';
    const compEmail = Array.isArray(companyEmails) && companyEmails.length > 0 ? companyEmails[0].trim() : '';
    const companyPhone = Array.isArray(companyPhones) && companyPhones.length > 0
      ? companyPhones[0].split('Published')[0].trim()
      : '';
    const publishedDataa = Array.isArray(publishedData) && publishedData.length > 0 ? publishedData[0].trim() : '';

    posts.push(
      new Post(
        postText,
        {
          current_url: source.url,
        },
        moment().unix(),
        [],
        [],
        new Map(
          Object.entries({
            company,
            companyAddress: compAddress,
            companyEmails: compEmail,
            companyWebsite: companyWeb,
            companyPhone,
            publishedData: publishedDataa,
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
      selector: ['div.border-top.border-light.pt-3.mb-4'],
      handler: postHandler,
    },
  ],
  30,
);
