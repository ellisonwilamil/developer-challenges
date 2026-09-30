import { Module } from '@nestjs/common';
import { MonitoringPointsModule } from '../monitoring-points/monitoring-points.module';
import { SensorsController } from './sensors.controller';
import { SensorsRepository } from './sensors.repository';
import { SensorsService } from './sensors.service';

@Module({
  imports: [MonitoringPointsModule],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsRepository],
})
export class SensorsModule {}
