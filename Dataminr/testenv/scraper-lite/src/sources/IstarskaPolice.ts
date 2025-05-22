import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Istarska Police',
  'https://istarska-policija.gov.hr',
  '/vijesti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
