import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Viroviticko-Podravska Police',
  'https://viroviticko-podravska-policija.gov.hr',
  '/vijesti-8/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
