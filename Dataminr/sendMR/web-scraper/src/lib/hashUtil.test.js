import { toSha256 } from './hashUtil';

describe('Sha-256 Module Testing', () => {
  it('', () => {
    const data = {
      source_id: '4E09CBE41A31FEF4A370E4E6B47C473B0D090E99C815F9DA287C09D54618E930'.toLowerCase(),
      type: 'CREDIT',
      group_path: ['main_group', 'sub_group'],
      metadata: {},
    };
    expect(toSha256(data)).toBe('9f3cc4c7faab9586e2430e1c35f9cbe3255f98f1fb430203e9c6554076731ecc');
  });
});
