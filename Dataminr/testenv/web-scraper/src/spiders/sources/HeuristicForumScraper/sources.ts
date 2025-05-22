export interface Source {
  url: string;
  entryUrl?: string;
  backFilledMinutes?: number;
  cron?: string;
  expireIn?: number;
  requestOption?: object;
}

export interface SourceMap {
  [index: string]: Source;
}

export const sources: SourceMap = {
  Cracked: { url: 'https://cracked.to' },
  Hovatek: { url: 'https://forum.hovatek.com/' },
  NeoGAF: {
    url: 'https://www.neogaf.com/',
    entryUrl: '/whats-new',
  },
  'Black Hat World': { url: 'https://www.blackhatworld.com/' },
  Babiato: {
    url: 'https://babiato.co/',
    entryUrl: '/whats-new/',
  },
  binrev: {
    url: 'http://www.binrev.com/forums',
    entryUrl: '/index.php?/discover/',
  },
  AVForums: { url: 'http://avforums.com' },
  Autopareri: { url: 'http://autopareri.com' },
  'BMW Fan Club': { url: 'http://bmwfaq.org' },
  'Baby Plan': { url: 'http://babyplan.ru' },
  BariatricPal: { url: 'http://bariatricpal.com' },
  'Clube de Hardware': { url: 'http://clubedohardware.com.br' },
  'Coin Talk': { url: 'http://cointalk.com' },
  ComputerBase: { url: 'http://computerbase.de' },
  DISboards: { url: 'http://disboards.com' },
  'Dien dan Game VN': { url: 'http://gamevn.com' },
  HardForum: { url: 'http://hardforum.com' },
  'Hip Forums': { url: 'http://hipforums.com' },
  Insomnia: { url: 'http://insomnia.gr' },
  'Jambos Kickback': { url: 'http://hmfckickback.co.uk' },
  'Jamii Foums': { url: 'http://jamiiforums.com' },
  'Kadinlar Kululbu': { url: 'http://kadinlarkulubu.com' },
  'Kenya Talk': { url: 'http://kenyatalk.com' },
  'Linus Tech Tips': { url: 'http://linustechtips.com' },
  'Lipstick Alley': { url: 'http://lipstickalley.com' },
  'Mac Rumors': { url: 'http://forums.macrumors.com' },
  'NAS Forum': { url: 'http://nas-forum.com' },
  'New Jersey Gun Forums': { url: 'http://njgunforums.com' },
  'Oto Fun': { url: 'http://otofun.net' },
  Raovat: { url: 'http://raovat.vn' },
  'RedCafe.net': { url: 'http://redcafe.net' },
  "River Dave's Place": { url: 'http://riverdavesplace.com' },
  'Sammyboy Times': { url: 'http://sammyboy.com' },
  'Tesla Motors Club': { url: 'http://teslamotorsclub.com' },
  'The Farming Forum': { url: 'http://thefarmingforum.co.uk' },
  'The Gear Page': { url: 'http://thegearpage.net' },
  'The Trek BBS': { url: 'http://trekbbs.com' },
  'US Message Board': { url: 'http://usmessageboard.com' },
  'Vaping Underground': { url: 'http://vapingunderground.com' },
  ViseJourney: { url: 'http://visajourney.com' },
  'Yellows Forum': { url: 'http://yellowsforum.co.uk' },
  Zwame: { url: 'http://zwame.pt' },
  'ignboards.com': { url: 'http://ignboards.com' },
};
