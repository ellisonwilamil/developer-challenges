import { join } from 'node:path';
import { loadEnvFile } from '../src/config/load-env-file';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedUser } from '../src/seed/seed-user';

// Run by `prisma db seed` (configured in prisma.config.ts). Idempotent, so it can run
// after every migration.
loadEnvFile(join(__dirname, '../../../.env'));

async function main(): Promise<void> {
  const prisma = new PrismaService();
  try {
    const user = await seedUser(prisma, {
      email: process.env.SEED_USER_EMAIL,
      password: process.env.SEED_USER_PASSWORD,
    });
    console.log(`Seed user: ${user}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
