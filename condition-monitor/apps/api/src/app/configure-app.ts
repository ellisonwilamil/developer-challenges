import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/**
 * Application-wide settings, shared by `main.ts` and the HTTP tests so that tests run
 * the same application the server does.
 */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  // A submission of 5,000 readings (C8) is about 0.6 MB of JSON; Express accepts 100 KB
  // by default. 2 MB matches the CSV upload limit.
  app.useBodyParser('json', { limit: '2mb' });
  app.use(cookieParser());
}
