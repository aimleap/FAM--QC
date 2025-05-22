import { getLists } from './index';

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

describe('Testing cl0p scraper', () => {
  describe('Testing getLists function', () => {
    it('getLists should return expected elements', async () => {
      const $ = cheerio.load(fs.readFileSync(`${path.join(__dirname, '../Cl0p')}/cl0p.html`));
      const entryEl = $('.site-body').get();
      entryEl.forEach((data: any) => {
        const $el = $(data);
        const postContent = getLists($, $el);
        if (postContent === undefined || postContent.length === 0) return;
        expect(postContent.length).toStrictEqual(232);
        expect(postContent[0]).toStrictEqual('MVTEC.COM');
      });
    });
  });
});
