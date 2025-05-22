import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { getForumComments } from '../../../../lib/parserUtil';

describe('Testing Ancaps scraper', () => {
  describe('Testing getForumComments function', () => {
    it('getForumComments should return expected elements', async () => {
      const $ = cheerio.load(fs.readFileSync(`${path.join(__dirname, '../Ancaps')}/ancaps.html`));
      const entryEl = $('article.main-content').get();
      entryEl.forEach((el: any) => {
        const $el = $(el);
        const comments = getForumComments(
          $,
          $el,
          'div.body',
          'div.content p',
          'span.since time.timeago',
          'datetime',
          'a.author',
          'a.author',
        );
        expect(comments.length).toStrictEqual(2);
        expect(comments[1].text).toStrictEqual(
          'But the Biden supporters and corporate press told me that Biden was pulling out of Afghanistan, who could have predicted this?',
        );
        expect(comments[1].isComment).toStrictEqual('1');
      });
    });
  });
});
