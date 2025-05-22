import {
  getIncident, getSecondaryItem, getSecondaryWarning, jsonToPost,
} from './911ScraperUtil';

const testJsonObject = [
  {
    type: 'Feature',
    properties: {
      feedType: 'warning',
      cap: [Object],
      sourceOrg: 'EMV',
      sourceId: '15189',
      sourceFeed: 'cop-cap',
      sourceTitle: 'Advice',
      id: '15189',
      category1: 'Advice',
      category2: 'Health',
      status: 'Minor',
      name: 'Advice',
      statewide: 'Y',
      location: 'Victoria',
      created: '2020-11-24T11:27:14+11:00',
      updated: '2020-11-24T11:27:15+11:00',
    },
  },
];

describe('Testing event Types', () => {
  describe('Testing warning Status', () => {
    it('should pass', () => {
      expect(getSecondaryWarning('Emergency Warning')).toStrictEqual(
        'Local authorities issue emergency warning in ',
      );
    });
  });
  describe('Testing status', () => {
    it('should pass', () => {
      // Testing primary element
      expect(getSecondaryItem('Safe')[0]).toStrictEqual('Firefighters clear ');
    });
  });
  describe('Testing events', () => {
    it('should pass', () => {
      expect(getIncident('Flooding')).toStrictEqual(' flood incident');
      expect(getIncident('Aircraft Accident')).toStrictEqual(' aircraft incident');
    });
  });
});

describe('Testing jsonToPost function', () => {
  it('should pass', () => {
    testJsonObject.forEach((el: any) => {
      expect(
        jsonToPost(
          el.properties,
          'location',
          'feedType',
          'created',
          'category1',
          '',
          'sourceOrg',
          '',
          '',
        ),
      ).toStrictEqual({
        location: 'Victoria',
        status: undefined,
        incidentType: 'warning',
        timestamp: '2020-11-24T11:27:14+11:00',
        agency: 'EMV',
        id: undefined,
        type: 'Advice',
        dynamicVar: undefined,
      });
    });
  });
});
