import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Osječko-Baranjska Police',
  'https://osjecko-baranjska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
