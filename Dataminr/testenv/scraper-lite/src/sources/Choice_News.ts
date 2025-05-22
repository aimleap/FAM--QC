import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Choice News',
  'https://www.choicenews.co.kr',
  '/news/articleList.html?box_idxno=&view_type=sm',
);
