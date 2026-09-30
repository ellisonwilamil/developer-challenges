import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app/app.module';
import { configureApp } from '../src/app/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser } from '../src/seed/seed-user';

/**
 * The real application on a random port, for integration tests over HTTP. Each test file
 * starts one and talks to it as a browser would.
 */
export async function startHttpApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.listen(0);
  const baseUrl = `${await app.getUrl()}/api`;
  const prisma = app.get(PrismaService);

  /** Creates the user if needed, logs in and returns a client that sends the cookie. */
  async function loginAs(email: string, password = 'correct horse battery') {
    const { userId } = await seedUser(prisma, { email, password });
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const cookie = response.headers.getSetCookie()[0]?.split(';')[0];
    if (response.status !== 204 || !cookie) {
      throw new Error(`Login as ${email} failed with status ${response.status}.`);
    }
    return { userId, request: client(baseUrl, cookie) };
  }

  return { app, baseUrl, prisma, loginAs, anonymous: client(baseUrl) };
}

export type HttpClient = ReturnType<typeof client>;

function client(baseUrl: string, cookie?: string) {
  return (method: string, path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}

/** Reads a JSON answer with the shape the test expects; the assertions check it. */
export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
