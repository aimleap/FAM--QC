import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Pozesko-Slavonska Police',
  'https://pozesko-slavonska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
