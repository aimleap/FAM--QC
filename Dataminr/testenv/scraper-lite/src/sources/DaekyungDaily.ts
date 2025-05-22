import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Daekyung Daily',
  'https://www.dkilbo.com',
  '/news/articleList.html?sc_section_code=S1N1&view_type=sm',
);
