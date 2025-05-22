import Joi from '@hapi/joi';
import logger from '../lib/logger';
import { SOURCE } from '../constants/source';

const schema = Joi.object().keys({
  url: Joi.string()
    .uri({
      scheme: ['http', 'https'],
    })
    .required(),
  type: Joi.string().valid(SOURCE.TYPE.FORUM, SOURCE.TYPE.MARKET_PLACE).required(),
  description: Joi.string().empty(''),
  name: Joi.string().empty(''),
});

export default class source {
  constructor(url, type, description, name) {
    this.url = url;
    this.type = type;
    this.description = description;
    this.name = name;
    const result = schema.validate(this);

    if (result.error) {
      logger.warn('invalid source schema', result.error, this);
      throw new Error('invalid source schema');
    }

    return this;
  }
}
