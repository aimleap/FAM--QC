import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Joongboo Ilbo',
  'http://www.joongboo.com',
  '/news/articleList.html?sc_section_code=S1N6&view_type=sm',
);
