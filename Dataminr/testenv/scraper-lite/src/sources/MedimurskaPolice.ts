import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Medimurska Police',
  'https://medjimurska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
