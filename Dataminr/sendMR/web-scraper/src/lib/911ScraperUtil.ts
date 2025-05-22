import Post from '../schema/post';
import Incident from '../schema/incident';

export function cleanText(text: string): string {
  return text.replace(/\n/g, '').trim();
}

export function toRows($: CheerioSelector, elements: CheerioElement[]): string[][] {
  return elements
    .map((element: CheerioElement) => $(element)
      .find('td')
      .map((i: number, col: CheerioElement) => cleanText($(col).text()))
      .get()
      .filter((x) => typeof x === 'string' && x.length > 0))
    .filter((row) => row.length > 0);
}

export function toPost(
  headline: string,
  address: string,
  incidentType: string,
  incidentId: string,
  timestamp: number,
  url: string,
): Post {
  return new Post(
    headline,
    {
      current_url: url,
    },
    timestamp,
    [],
    [],
    new Map(
      Object.entries({
        ADDRESS: address,
        INCIDENT_TYPE: incidentType,
        INCIDENT_ID: incidentId,
      }),
    ),
  );
}

export function incidentToPost(incidentData: Incident): Post {
  return new Post(
    incidentData.compositeText,
    {
      current_url: incidentData.url,
    },
    incidentData.timestamp,
    [],
    [],
    new Map(
      Object.entries({
        COMPOSITE_LOCATION: incidentData.compositeLocation,
        LOCATION: incidentData.location,
        CROSS_STREET: incidentData.crossStreet,
        COUNTY: incidentData.county,
        STATE: incidentData.state,
        COUNTRY: incidentData.country,
        INCIDENT_TYPE: incidentData.incidentType,
        INCIDENT_ID: incidentData.incidentId,
        NOTES: incidentData.notes,
        STATUS: incidentData.status,
        RESPONDER: incidentData.responder,
      }),
    ),
  );
}

export interface jsonElements {
  location: any;
  status: string;
  incidentType: string;
  timestamp: any;
  agency: string | null;
  id: string | null;
  type: string;
  dynamicVar: any;
}
/**
 *
 * @param elements - json elements returned from request
 * @param locationElement - location attribute
 * @param eventTypeElement - event type, eg: incident
 * @param timestampElement - event timestamp
 * @param eventDescriptionElement - event description, eg: Forest Fire
 * @param statusElement - responding status, eg: Complete
 * @param agencyElement - responding agency, eg: New South Wales Fire Service
 * @param args - optional arguments (include any extra parameter needed)
 * @param idElement - event id
 */
export function jsonToPost(
  elements: string,
  locationElement: any,
  eventTypeElement: any,
  timestampElement: any,
  eventDescriptionElement: any,
  statusElement: any,
  agencyElement?: any,
  args?: any,
  idElement?: any,
): jsonElements {
  const location = elements[locationElement];
  const status = elements[statusElement];
  const incidentType = elements[eventTypeElement];
  const timestamp = elements[timestampElement];
  const agency = elements[agencyElement];
  const id = elements[idElement];
  const type = elements[eventDescriptionElement];
  const dynamicVar = elements[args];
  return {
    location,
    status,
    incidentType,
    timestamp,
    agency,
    id,
    type,
    dynamicVar,
  };
}

// 911 scrapers Event types mappings

export interface Item {
  primary: string;
  secondary?: string;
}

export interface SecondaryIncidentItem {
  [index: string]: Item;
}

export interface PrimaryIncidentItem {
  [index: string]: string;
}

export const events: PrimaryIncidentItem = {
  'assist other agency': ' incident',
  'burn off': ' prescribed burn',
  'bush fire': ' grass fire',
  'fire alarm': ' fire',
  'flood/storm/tree down': ' incident',
  'grass fire': ' grass fire incident',
  'haystack fire': ' haystack fire',
  'hazard reduction': ' prescribed burn',
  hazmat: ' incident involving hazardous materials',
  medical: ' medical incident',
  'search/rescue': ' search and rescue incident',
  'vehicle/equipment fire': ' fire',
  'mva/transport': ' transportation incident',
  'structure fire': ' fire incident',
  flooding: ' flood incident',
  'tree down': ' fallen tree incident',
  'building damage': ' incident involving damaged building',
  bushfire: ' bushfire incident',
  'non structure fire': ' fire incident',
  other: ' incident',
  'burn area': ' planned burn',
  'aircraft accident': ' aircraft incident',
  'dam failure': ' dam incident',
  flood: ' flood incident',
  'hazardous material': ' incident involving hazardous material',
  landslide: ' landslide incident',
  'marine accident': ' marine incident',
  'medical/human health': ' medical emergency incident',
  'planned burn': ' planned burn',
  'rail accident': ' railway incident',
  rescue: ' rescue incident',
  'vehicle accident': 'vehicle incident',
  'rescue person trapped': ' incident involving trapped individuals',
  fire: ' fire incident',
  'prescribed burn': ' prescribed burn',
  'tree fire': ' fire incident',
  'building fire': ' fire incident',
  'bbq fire': ' fire incident',
  'controlled burn off': ' prescribed burn',
  explosion: ' incident involving explosion',
  'dump fire': ' fire incident',
  'fence fire': ' fire incident',
  'forest fire': 'fire incident',
  'grass and stubble fire': ' grass fire incident',
  'grain/crop fire': ' grass fire incident',
  'incinerator fire': ' fire',
  'scrub and grass fire': ' grass fire incident',
  'storage yard fire': ' fire',
  'aircraft incident': ' aircraft incident',
  'alarm dba': ' fire',
  'alarm domestic': ' fire',
  'alarm fire/security': ' fire',
  'chimney /heater/ flue': ' fire',
  'community service': ' incident',
  'electrical problem': ' electrical incident',
  'fire incident': ' fire',
  'marine incident': ' marine incident',
  mva: ' car crash',
  'power pole fire': ' power line fire',
  'rescue confined space': ' incident involving trapped individuals',
  'rescue technical': ' incident involving trapped individuals',
  'rescue trench': ' incident involving trapped individuals',
  'rescue usar': ' incident involving trapped individuals',
  'rescue vertical': ' incident involving trapped individuals',
  'rubbish fire': ' garbage fire',
  'ship/boat fire': ' boat fire',
  'smell of burning': ' potential fire',
  'smoke investigation': ' smoke report',
  'vegetation fire': ' grass fire incident',
  'vehicle fire': ' car fire',
  'fire reduction burn': ' prescribed burn',
  'storm or tree damage': ' incident',
  'ambulance response': ' medical emergency incident',
  information: ' fire',
  advice: ' fire',
  'watch and act': ' serious fire',
  'emergency warning': ' threatening fire',
  'active alarm': 'active fire alarm',
};

export const status: SecondaryIncidentItem = {
  Responding: {
    primary: 'Firefighters respond to ',
    secondary: 'N/A',
  },
  Safe: {
    primary: 'Firefighters clear ',
    secondary: 'N/A',
  },
  'Under Control': {
    primary: 'Firefighters contain ',
    secondary: 'N/A',
  },
  'Being Controlled': {
    primary: 'Firefighters controlling ',
    secondary: 'N/A',
  },
  Going: {
    primary: 'Firefighters respond to ongoing ',
    secondary: 'N/A',
  },
  'On Scene': {
    primary: 'Firefighters on scene at ',
    secondary: 'N/A',
  },
  Patrolled: {
    primary: 'Firefighters complete response to ',
    secondary: 'N/A',
  },
  'Request For Assistance': {
    primary: 'Firefighters respond to ',
    secondary: 'N/A',
  },
  Complete: {
    primary: 'Firefighters complete response to ',
    secondary: 'N/A',
  },
  Contained: {
    primary: 'Firefighters contain ',
    secondary: 'N/A',
  },
  'Out Of Control': {
    primary: 'N/A',
    secondary: ' reported',
  },
  Advice: {
    primary: 'Local authorities issue advice warning in ',
    secondary: 'N/A',
  },
  'Community Information': {
    primary: 'Local authorities issue community information in ',
    secondary: 'N/A',
  },
  'Emergency Warning': {
    primary: 'Local authorities issue emergency warning in ',
    secondary: 'N/A',
  },
  Warning: {
    primary: 'Local authorities issue warning in ',
    secondary: 'N/A',
  },
  Closed: {
    primary: 'Firefighters complete response to ',
    secondary: ' clear',
  },
  Patrol: {
    primary: 'Firefighters respond to ',
    secondary: 'N/A',
  },
  'Out / Completed': {
    primary: 'Firefighters complete response to ',
    secondary: 'N/A',
  },
  'Resource Allocation Pending': {
    primary: 'N/A',
    secondary: ' reported',
  },
  'Units On Route': {
    primary: 'Firefighters respond to ',
    secondary: 'N/A',
  },
  Controlled: {
    primary: 'Firefighters control ',
    secondary: 'N/A',
  },
};

export const warningStatus: SecondaryIncidentItem = {
  Advice: {
    primary: 'Local authorities issue advice warning in ',
  },
  'Community Information': {
    primary: 'Local authorities issue community information in ',
  },
  'Emergency Warning': {
    primary: 'Local authorities issue emergency warning in ',
  },
  Warning: {
    primary: 'Local authorities issue warning in ',
  },
  'Bushfire Warning': {
    primary: 'Local authorities issue bushfire warning in ',
  },
};

export function getIncident(type: string) {
  return events[type.toLowerCase()];
}

export function getSecondaryItem(eventStatus: string) {
  return [status[eventStatus].primary, status[eventStatus].secondary];
}

export function getSecondaryWarning(eventStatus: string) {
  return warningStatus[eventStatus].primary;
}
