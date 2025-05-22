import { getHeadline } from './index';

describe('Testing util functions', () => {
  describe('Testing headline function', () => {
    it('should pass', () => {
      const incidentType = 'Grass Fire';
      const status = 'Resource Allocation Pending';
      const location = 'Wanniassa';
      expect(
        getHeadline(incidentType, status, location)
          ?.replace('\n', '')
          .replace('N/A', '')
          .trim()
          .replace(/\s\s+/g, ' '),
      ).toStrictEqual('Grass Fire at Wanniassa, Australia');
    });
  });
});
