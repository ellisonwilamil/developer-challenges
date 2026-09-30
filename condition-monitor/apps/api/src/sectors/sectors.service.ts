import { Injectable } from '@nestjs/common';
import type { CreateSectorRequest, Sector, UpdateSectorRequest } from '@condition-monitor/shared';
import { isRecordNotFound, isUniqueViolation } from '../common/database/prisma-errors';
import { conflict, notFound } from '../common/problem/problems';
import { SectorsRepository } from './sectors.repository';

/** Sector rules (assumption B9). The database enforces them; this layer explains refusals. */
@Injectable()
export class SectorsService {
  constructor(private readonly sectors: SectorsRepository) {}

  list(ownerId: string): Promise<Sector[]> {
    return this.sectors.listByOwner(ownerId);
  }

  async create(ownerId: string, body: CreateSectorRequest): Promise<Sector> {
    try {
      return await this.sectors.create(ownerId, body);
    } catch (error) {
      throw this.translate(error, body.code);
    }
  }

  async update(ownerId: string, id: string, body: UpdateSectorRequest): Promise<Sector> {
    try {
      return await this.sectors.update(ownerId, id, body);
    } catch (error) {
      throw this.translate(error, body.code);
    }
  }

  async delete(ownerId: string, id: string): Promise<void> {
    try {
      await this.sectors.delete(ownerId, id);
    } catch (error) {
      throw this.translate(error);
    }
  }

  private translate(error: unknown, code?: string): unknown {
    if (isUniqueViolation(error)) {
      return conflict('Sector code in use', `Sector code ${code} is already in use.`, [
        { field: 'code', message: `Code ${code} is already in use.` },
      ]);
    }
    if (isRecordNotFound(error)) {
      return notFound('Sector');
    }
    return error;
  }
}
