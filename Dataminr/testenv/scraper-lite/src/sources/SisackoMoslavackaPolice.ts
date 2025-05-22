import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Sisačko-Moslavačka Police',
  'https://sisacko-moslavacka-policija.gov.hr',
  '/vijesti-8/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
