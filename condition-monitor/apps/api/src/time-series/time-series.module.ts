import { Module } from '@nestjs/common';
import { IngestionRepository } from './ingestion.repository';
import { IngestionService } from './ingestion.service';
import { ReadingsController } from './readings.controller';

@Module({
  controllers: [ReadingsController],
  providers: [IngestionService, IngestionRepository],
})
export class TimeSeriesModule {}
