import { parseReturnFields, iterateMapping, dateFormatter } from './dgiUtils';

describe('Testing dgiUtils parseReturnFields', () => {
  it('should pass', () => {
    const testString = 'title;description';
    const testSplit = ';';
    const parsedConfig = parseReturnFields(testString, testSplit);
    // @ts-ignore
    expect(['title', 'description']).toEqual(parsedConfig);
  });
});

describe('Testing dgiUtils iterateMapping', () => {
  it('should pass', () => {
    const testList = ['title'];
    const item = {
      title: 'lord of the rings',
    };

    const mapping = iterateMapping(testList[0], item);
    // @ts-ignore
    expect(mapping).toEqual('lord of the rings');
  });
});

describe('Testing dgiUtils dateFormatter', () => {
  it('should pass', () => {
    const item = {
      pubDate: 'Tue, 02 Aug 2022 19:09:06 +0000',
    };
    const itemKey = 'pubDate';

    const mapping = dateFormatter(item, itemKey, '');
    // @ts-ignore
    expect(mapping).toEqual(1659467346);
  });
});

describe('Testing dgiUtils getDateElement', () => {
  it('should pass', () => {
    const item = {
      title: 'NIO STOCK PRICE PREDICTION UPDATE FOR 2022   WHERE DOES NIO GO FROM HERE?',
      link: 'https://www.youtube.com/watch?v=2z9l6az3Io0',
      pubDate: '2022-08-01T17:32:24.000Z',
      author: 'Stock Moe',
      id: 'yt:video:2z9l6az3Io0',
      isoDate: '2022-08-01T17:32:24.000Z',
    };
    const itemKey = 'isoDate';

    const mapping = dateFormatter(item, itemKey, '');
    // @ts-ignore
    expect(mapping).toEqual(1659375144);
  });
});
