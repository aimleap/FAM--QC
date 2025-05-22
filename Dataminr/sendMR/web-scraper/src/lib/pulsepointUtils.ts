import { createDecipheriv, createHash } from 'crypto';
import Logger from './logger';
import { SourceType } from './parserUtil';
import { getLatestConfig } from './cacheUtil';

export interface PulsePointResponse {
  ct: string;
  iv: string;
  s: string;
}

export interface Incident {
  CallReceivedDateTime: string;
  ID: string;
  AgencyID: string;
  PulsePointIncidentCallType: string;
  Latitude: number;
  Longitude: number;
  FullDisplayAddress: string;
  CommonPlaceName: string;
  MedicalEmergencyDisplayAddress: string;
}

export interface ActiveIncidents {
  active: Incident[];
  recent: Incident[];
}

export interface PulsePointDataObject {
  incidents: ActiveIncidents;
}

export interface PulsePointAgency {
  agencyname: string;
  agencyid: string;
  state: string;
}

export interface PulsePointAgencies {
  agencies: PulsePointAgency[];
}

interface PulsePointConfig {
  session: object;
  authentication: object;
  configurations: PulsePointAgencies;
}

interface IncidentType {
  [key: string]: string;
}

const getHashComponents = (data: PulsePointResponse) => {
  const cipherText = Buffer.from(data.ct, 'base64');
  const initVector = Buffer.from(data.iv, 'hex');
  const salt = Buffer.from(data.s, 'hex');
  return { cipherText, initVector, salt };
};

// ref: https://github.com/Podskio/pulsepoint/blob/f6d296875d8729213d8b0e7aae9e7ebf352b69c0/lib/crypto.ts
export const decodePulsePointResponse = (data: PulsePointResponse): string | null => {
  try {
    const { cipherText, initVector, salt } = getHashComponents(data);

    let hash = createHash('md5');
    let intermediateHash = null;
    let key = Buffer.alloc(0);

    // Derive key
    while (key.length < 32) {
      // @ts-ignore
      if (intermediateHash) hash.update(intermediateHash);
      hash.update('tombrady5rings');
      // @ts-ignore
      hash.update(salt);
      intermediateHash = hash.digest();
      hash = createHash('md5');
      // @ts-ignore
      key = Buffer.concat([key, intermediateHash]);
    }
    // @ts-ignore
    const decipher = createDecipheriv('aes-256-cbc', key, initVector);
    // @ts-ignore
    let output = decipher.update(cipherText);
    // @ts-ignore
    output = Buffer.concat([output, decipher.final()]);
    // Remove leading and trailing quotes
    return output.toString().slice(1, -1);
  } catch (err) {
    Logger.info('Failed to decode Pulse Point response', err);
    return null;
  }
};

export const parsePulsePointIncidents = (data: PulsePointResponse): PulsePointDataObject | null => {
  const decipheredData = decodePulsePointResponse(data);
  if (!decipheredData) return null;
  try {
    const cleanedData = decipheredData.replaceAll(/\\"/g, '"').replaceAll(/\\n/g, '');
    return JSON.parse(cleanedData);
  } catch (err) {
    Logger.info('Failed to parse Pulse Point incidents', err);
    return null;
  }
};

export async function getPulsePointAgenciesFromConfigUI(
  source: SourceType,
): Promise<PulsePointAgencies | null> {
  const config: PulsePointConfig | null = {
    session: {},
    authentication: {},
    configurations: {
      agencies: [
        {
          agencyname: '',
          agencyid: '',
          state: '',
        },
      ],
    },
    ...(await getLatestConfig(source.name)),
  };
  return config.configurations;
}

// TODO: move this to config UI
const incidentTypes: IncidentType = {
  AA: 'Auto Aid',
  MU: 'Mutual Aid',
  ST: 'Strike Team/Task Force',
  AC: 'Aircraft Crash',
  AE: 'Aircraft Emergency',
  AES: 'Aircraft Emergency Standby',
  LZ: 'Landing Zone',
  AED: 'AED Alarm',
  OA: 'Alarm',
  CMA: 'Carbon Monoxide',
  FA: 'Fire Alarm',
  MA: 'Manual Alarm',
  SD: 'Smoke Detector',
  TRBL: 'Trouble Alarm',
  WFA: 'Waterflow Alarm',
  FL: 'Flooding',
  LR: 'Ladder Request',
  LA: 'Lift Assist',
  PA: 'Police Assist',
  PS: 'Public Service',
  SH: 'Sheared Hydrant',
  EX: 'Explosion',
  PE: 'Pipeline Emergency',
  TE: 'Transformer Explosion',
  AF: 'Appliance Fire',
  CHIM: 'Chimney Fire',
  CF: 'Commercial Fire',
  WSF: 'Confirmed Structure Fire',
  WVEG: 'Confirmed Vegetation Fire',
  CB: 'Controlled Burn/Prescribed Fire',
  ELF: 'Electrical Fire',
  EF: 'Extinguished Fire',
  FIRE: 'Fire',
  FULL: 'Full Assignment',
  IF: 'Illegal Fire',
  MF: 'Marine Fire',
  OF: 'Outside Fire',
  PF: 'Pole Fire',
  GF: 'Refuse/Garbage Fire',
  RF: 'Residential Fire',
  SF: 'Structure Fire',
  VEG: 'Vegetation Fire',
  VF: 'Vehicle Fire',
  WCF: 'Working Commercial Fire',
  WRF: 'Working Residential Fire',
  BT: 'Bomb Threat',
  EE: 'Electrical Emergency',
  EM: 'Emergency',
  ER: 'Emergency Response',
  GAS: 'Gas Leak',
  HC: 'Hazardous Condition',
  HMR: 'Hazmat Response',
  TD: 'Tree Down',
  WE: 'Water Emergency',
  AI: 'Arson Investigation',
  HMI: 'Hazmat Investigation',
  INV: 'Investigation',
  OI: 'Odor Investigation',
  SI: 'Smoke Investigation',
  LO: 'Lockout',
  CL: 'Commercial Lockout',
  RL: 'Residential Lockout',
  VL: 'Vehicle Lockout',
  IFT: 'Interfacility Transfer',
  ME: 'Medical Emergency',
  MCI: 'Multi Casualty',
  EQ: 'Earthquake',
  FLW: 'Flood Warning',
  TOW: 'Tornado Warning',
  TSW: 'Tsunami Warning',
  CA: 'Community Activity',
  FW: 'Fire Watch',
  NO: 'Notification',
  STBY: 'Standby',
  TEST: 'Test',
  TRNG: 'Training',
  UNK: 'Unknown',
  AR: 'Animal Rescue',
  CR: 'Cliff Rescue',
  CSR: 'Confined Space',
  ELR: 'Elevator Rescue',
  RES: 'Rescue',
  RR: 'Rope Rescue',
  TR: 'Technical Rescue',
  TNR: 'Trench Rescue',
  USAR: 'Urban Search and Rescue',
  VS: 'Vessel Sinking',
  WR: 'Water Rescue',
  TCE: 'Expanded Traffic Collision',
  RTE: 'Railroad/Train Emergency',
  TC: 'Traffic Collision',
  TCS: 'Traffic Collision Involving Structure',
  TCT: 'Traffic Collision Involving Train',
  WA: 'Wires Arcing',
  WD: 'Wires Down',
};

export { incidentTypes };
