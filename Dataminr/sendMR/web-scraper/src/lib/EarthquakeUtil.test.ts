import { toPost } from './EarthquakeUtil';

describe('Testing toPost function', () => {
  it('should pass', () => {
    expect(
      toPost(
        'Earthquake at San Francisco',
        '37.77N 122.41W, San Francisco',
        '12km',
        0,
        '10',
        'earthquake.com',
      ),
    ).toEqual({
      extraData: {
        DEPTH: '12km',
        LOCATION: '37.77N 122.41W, San Francisco',
        MAGNITUDE: '10',
        parser_type: 'FORUM_PARSER',
      },
      forum_paths: [],
      media: [],
      metadata: {
        current_url: 'earthquake.com',
      },
      posted_at: 0,
      source_channels: [],
      tagMap: {},
      text: 'Earthquake at San Francisco',
      type: '',
    });
  });
});
