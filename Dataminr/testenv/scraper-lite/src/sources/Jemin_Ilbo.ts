import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Jemin Ilbo',
  'https://www.jemin.com',
  '/news/articleList.html?sc_sub_section_code=S2N11&view_type=sm',
);
