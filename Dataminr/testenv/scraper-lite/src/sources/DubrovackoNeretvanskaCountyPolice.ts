import { createPoliceParser } from '../lib/policeUtil';

export const parser = createPoliceParser(
  'Dubrovačko-Neretvanska County Police',
  'https://dubrovacko-neretvanska-policija.gov.hr',
  '/novosti/8?trazi=1&tip=&tip2=&tema=&datumod=&datumdo=&pojam=&page=',
);
