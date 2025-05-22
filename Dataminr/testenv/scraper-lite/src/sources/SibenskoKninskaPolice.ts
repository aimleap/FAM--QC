import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Sibensko-Kninska Police',
  'https://sibensko-kninska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
