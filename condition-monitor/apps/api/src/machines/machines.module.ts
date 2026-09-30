import { Module } from '@nestjs/common';
import { MachinesController } from './machines.controller';
import { MachinesRepository } from './machines.repository';
import { MachinesService } from './machines.service';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, MachinesRepository],
})
export class MachinesModule {}
