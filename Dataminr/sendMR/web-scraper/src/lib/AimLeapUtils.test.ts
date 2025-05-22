import { excludeUser, extractUserName, parseConfig } from './aimLeapUtils';

const schemaNoOptions = {
  test: {
    schema: {
      Type: 'event',
      More_Information: 'subtext',
      'User Name': 'entity',
    },
  },
};

const testSchema = {
  test: {
    options: {
      set_source_name: true,
    },
    schema: {
      Type: 'event',
      More_Information: 'subtext',
      'User Name': 'entity',
    },
  },
};

const testExtraData = {
  Type: 'test type',
  More_Information: 'this is a subtext with more information',
  'User Name': 'testUser',
};

const missingExtraData = {
  Type: 'test type',
  More_Information: 'this is a subtext with more information',
};

const parsedConfig = parseConfig(testExtraData, testSchema, 'test');
describe('Testing AimLeap config parser', () => {
  it('should pass', () => {
    // @ts-ignore
    expect(Array.from(parsedConfig.keys())).toStrictEqual([
      'event',
      'subtext',
      'entity',
      'message_source_name',
    ]);
  });
});

describe('Testing AimLeap parser utility methods', () => {
  describe('Testing exclude user method', () => {
    it('should pass', () => {
      const userList = ['6405745618', '6439298407'];
      const exclude = excludeUser('6405745618', userList);
      expect(exclude).toBeTruthy();
    });
  });
  describe('Testing extract user method', () => {
    it('should pass', () => {
      const userName = extractUserName(parsedConfig!, ['test']);
      expect(userName).toStrictEqual('testUser');
    });
  });
  describe('Testing extract user method no set source option', () => {
    it('should pass', () => {
      const config = parseConfig(missingExtraData, testSchema, 'test');
      const userName = extractUserName(config!, ['test']);
      expect(userName).toStrictEqual('test');
    });
  });
  describe('Testing extract user method when schema options are not specified', () => {
    it('should pass', () => {
      const config = parseConfig(testExtraData, schemaNoOptions, 'test');
      const userName = extractUserName(config!, ['test']);
      expect(userName).toStrictEqual('test');
    });
  });
});
