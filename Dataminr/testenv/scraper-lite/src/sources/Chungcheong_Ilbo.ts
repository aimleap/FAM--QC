import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Chungcheong Ilbo',
  'https://www.ccdailynews.com',
  '/news/articleList.html?sc_section_code=S1N5&view_type=sm',
);
