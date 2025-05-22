import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Krapinsko-Zagorska Police',
  'https://krapinsko-zagorska-policija.gov.hr',
  '/vijesti-85/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
