import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Croatia Fire Department',
  'https://hvz.gov.hr',
  '/pomoc-stradalima-u-turskoj-i-siriji/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
