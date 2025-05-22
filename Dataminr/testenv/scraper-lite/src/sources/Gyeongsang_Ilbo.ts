import { createIlboParser } from '../lib/ilboUtil';

export const parser = createIlboParser(
  'Gyeongsang Ilbo',
  'http://www.ksilbo.co.kr',
  '/news/articleList.html?box_idxno=&view_type=sm',
);
