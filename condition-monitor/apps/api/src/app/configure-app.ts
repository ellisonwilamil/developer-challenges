import type { INestApplication } from '@nestjs/common';

/**
 * Application-wide settings, shared by `main.ts` and the HTTP tests so that tests run
 * the same application the server does.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
}
