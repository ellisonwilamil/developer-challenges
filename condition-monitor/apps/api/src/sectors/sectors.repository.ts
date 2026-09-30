import { Injectable } from '@nestjs/common';
import type { CreateSectorRequest, Sector, UpdateSectorRequest } from '@condition-monitor/shared';
import { PrismaService } from '../prisma/prisma.service';

const SECTOR_FIELDS = { id: true, code: true, name: true } as const;

/**
 * The only place that queries the sectors table (ADR 0002). Every query is scoped to the
 * owner (assumption A4): a sector of another user is simply not found.
 */
@Injectable()
export class SectorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Ordered by code, with the id as tiebreaker so the order is always the same. */
  listByOwner(ownerId: string): Promise<Sector[]> {
    return this.prisma.sector.findMany({
      where: { ownerId },
      select: SECTOR_FIELDS,
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });
  }

  create(ownerId: string, data: CreateSectorRequest): Promise<Sector> {
    return this.prisma.sector.create({ data: { ...data, ownerId }, select: SECTOR_FIELDS });
  }

  /** Throws Prisma's record-not-found error when the sector is missing or not owned. */
  update(ownerId: string, id: string, data: UpdateSectorRequest): Promise<Sector> {
    return this.prisma.sector.update({ where: { id, ownerId }, data, select: SECTOR_FIELDS });
  }

  /** Throws Prisma's record-not-found error when the sector is missing or not owned. */
  async delete(ownerId: string, id: string): Promise<void> {
    await this.prisma.sector.delete({ where: { id, ownerId } });
  }
}
