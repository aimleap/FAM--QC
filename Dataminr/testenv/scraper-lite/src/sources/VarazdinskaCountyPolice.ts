import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Varaždinska County Police',
  'https://varazdinska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
