import { sns } from 'config';

const { topics } = sns;

if (!Array.isArray(topics) || topics.length === 0) {
  throw new Error(`invalid sns topics configuration ${topics}`);
}

export const SNS_TOPICS = {
  EA_CONTENT_CREATE: topics.find((x) => x.indexOf('team_x_ea-content-create') !== -1),
};
