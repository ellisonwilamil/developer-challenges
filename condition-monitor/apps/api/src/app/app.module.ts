import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { ProblemDetailsFilter } from '../common/problem/problem-details.filter';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { HealthController } from '../health/health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SectorsModule } from '../sectors/sectors.module';

@Module({
  imports: [PrismaModule, AuthModule, SectorsModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
