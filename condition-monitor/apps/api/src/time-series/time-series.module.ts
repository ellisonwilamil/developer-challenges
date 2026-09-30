import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { IngestionRepository } from './ingestion.repository';
import { IngestionService } from './ingestion.service';
import { ReadingsController } from './readings.controller';

@Module({
  controllers: [ReadingsController, ImportsController],
  providers: [IngestionService, IngestionRepository],
})
export class TimeSeriesModule {}
