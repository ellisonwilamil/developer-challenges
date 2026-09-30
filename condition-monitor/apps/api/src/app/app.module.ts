import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { ProblemDetailsFilter } from '../common/problem/problem-details.filter';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';
import { HealthController } from '../health/health.controller';
import { MachinesModule } from '../machines/machines.module';
import { MonitoringPointsModule } from '../monitoring-points/monitoring-points.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SectorsModule } from '../sectors/sectors.module';
import { SensorsModule } from '../sensors/sensors.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SectorsModule,
    MachinesModule,
    MonitoringPointsModule,
    SensorsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
