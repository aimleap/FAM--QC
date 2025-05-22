import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import RateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import healthcheck from './healthcheck';
import restart from './restart';
import { redisClient } from '../lib/redis';

const FIFTEEN_MIN = 15 * 60 * 1000;

export default async function router(app: Express) {
  /* Best security practices */
  app.use(cors());
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: false,
      directives: {
        'default-src': ["'self'", 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        'script-src': ["'self'", 'cdn.jsdelivr.net'],
        'style-src': [
          "'self'",
          'cdn.jsdelivr.net',
          'fonts.googleapis.com',
          "'unsafe-inline'",
          "'unsafe-hashes'",
          'fonts.gstatic.com',
        ],
      },
      reportOnly: false,
    }),
  );
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  /* Rate Limit */

  const limiter = (max: number, windowMs: number) => RateLimit({
    store: new RedisStore({
      // @ts-expect-error
      sendCommand: (...args) => redisClient.call(...args),
    }),
    max,
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/restart', limiter(1, FIFTEEN_MIN));
  app.use('/restart', restart);

  app.get('/', (req, res) => res.send('Hello World!'));
  app.get('/healthcheck', healthcheck.bind(null, app));
}
