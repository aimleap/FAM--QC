export default class incident {
  compositeText: string;

  compositeLocation: string;

  location: string;

  crossStreet: string;

  county: string;

  state: string;

  country: string;

  incidentType: string;

  incidentId: string;

  notes: string;

  status: string;

  responder: string;

  timestamp: number;

  url: string;

  constructor({
    compositeText = '',
    compositeLocation = '',
    location = '',
    crossStreet = '',
    county = '',
    state = '',
    country = '',
    incidentType = '',
    incidentId = '',
    notes = '',
    status = '',
    responder = '',
    timestamp = 0,
    url = '',
  }) {
    this.compositeText = compositeText;
    this.compositeLocation = compositeLocation;
    this.location = location;
    this.crossStreet = crossStreet;
    this.county = county;
    this.state = state;
    this.country = country;
    this.incidentType = incidentType;
    this.incidentId = incidentId;
    this.notes = notes;
    this.status = status;
    this.responder = responder;
    this.timestamp = timestamp;
    this.url = url;
    return this;
  }
}
