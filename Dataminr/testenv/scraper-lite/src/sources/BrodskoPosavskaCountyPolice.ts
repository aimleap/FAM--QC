import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Brodsko-Posavska County Police',
  'https://brodsko-posavska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
