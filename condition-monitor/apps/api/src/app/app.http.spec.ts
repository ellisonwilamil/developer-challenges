import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

/** Runs the real application on a random port and talks to it over HTTP. */
describe('API over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.listen(0);
    baseUrl = `${await app.getUrl()}/api`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers the health check', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('answers an unknown route with a Problem Details 404', async () => {
    const response = await fetch(`${baseUrl}/nothing-here`);

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(await response.json()).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Cannot GET /api/nothing-here',
    });
  });

  it('serves routes only under the /api prefix', async () => {
    const response = await fetch(baseUrl.replace(/\/api$/, '/health'));

    expect(response.status).toBe(404);
  });
});
