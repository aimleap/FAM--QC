import cheerio from 'cheerio';
import { getUnixTimestamp } from './index';

describe('Testing ReadUs Module', () => {
  describe('Testing getUnixTimestamp method', () => {
    it('', () => {
      const html = '<td class="trow1 forumdisplay_sticky" style="white-space: nowrap; text-align: right;"><span class="lastpost smalltext">09-01-2020, 05:20 PM<br><a href="showthread.php?tid=2&amp;action=lastpost">Last Post</a>: <a href="http://readusfc7mroxn2mahmbu5wjpyspokriixbfbleemugxbgowxqi7yhyd.onion/member.php?action=profile&amp;uid=48">mypassistheNword</a></span></td>';
      const $ = cheerio.load(html);
      const element = $('.lastpost').get();
      // @ts-ignore
      expect(getUnixTimestamp($, element)).toEqual(1598980800);
    });

    it('', () => {
      const html = '<td class="trow1 forumdisplay_regular" style="white-space: nowrap; text-align: right;"><span class="lastpost smalltext"><span title="09-09-2020">Yesterday</span>, 09:40 PM<br><a href="showthread.php?tid=118&amp;action=lastpost">Last Post</a>: <a href="http://readusfc7mroxn2mahmbu5wjpyspokriixbfbleemugxbgowxqi7yhyd.onion/member.php?action=profile&amp;uid=67">tomandjerry</a></span></td>';
      const $ = cheerio.load(html);
      const element = $('.lastpost').get();
      // @ts-ignore
      expect(getUnixTimestamp($, element)).toEqual(1599687600);
    });
  });
});
