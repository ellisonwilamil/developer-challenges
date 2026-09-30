import { Injectable } from '@nestjs/common';
import {
  buildMachineTag,
  MACHINE_NUMBER_MAX,
  machineTypeMapping,
  type CreateMachineRequest,
  type ListMachinesQuery,
  type Machine,
  type MachineDetail,
  type MachineType,
  type NextNumber,
  type Page,
  type UpdateMachineRequest,
} from '@condition-monitor/shared';
import { isUniqueViolation } from '../common/database/prisma-errors';
import { conflict, notFound } from '../common/problem/problems';
import { MonitoringPointsRepository } from '../monitoring-points/monitoring-points.repository';
import { toMonitoringPoint } from '../monitoring-points/point-mapper';
import { MachinesRepository, type MachineRecord, type MachineWrite } from './machines.repository';

/** The tag is built on every answer, never stored (assumption B10). */
function toMachine(record: MachineRecord): Machine {
  const type = machineTypeMapping.fromDb(record.type);
  return {
    id: record.id,
    tag: buildMachineTag(record.sector.code, type, record.number),
    name: record.name,
    type,
    number: record.number,
    sector: record.sector,
  };
}

/** Machine rules (assumptions B2, B6, B10). The database enforces them; this layer explains. */
@Injectable()
export class MachinesService {
  constructor(
    private readonly machines: MachinesRepository,
    private readonly points: MonitoringPointsRepository,
  ) {}

  async list(ownerId: string, query: ListMachinesQuery): Promise<Page<Machine>> {
    const { items, total } = await this.machines.list(ownerId, query);
    return { items: items.map(toMachine), total, page: query.page, pageSize: query.pageSize };
  }

  /** The machine with its points, and what deleting it would remove (B6). */
  async get(ownerId: string, id: string): Promise<MachineDetail> {
    const record = await this.machines.findOwned(ownerId, id);
    if (!record) throw notFound('Machine');
    const [points, counts] = await Promise.all([
      this.points.listByMachine(id),
      this.points.countsOfMachine(id),
    ]);
    return { ...toMachine(record), monitoringPoints: points.map(toMonitoringPoint), counts };
  }

  /**
   * One above the highest number of that type in the sector (B10). A retired number is not
   * reused, since documents and history still refer to it; the user may still pick it.
   */
  async nextNumber(ownerId: string, sectorId: string, type: MachineType): Promise<NextNumber> {
    const sector = await this.machines.findOwnedSector(ownerId, sectorId);
    if (!sector) throw notFound('Sector');
    const number =
      ((await this.machines.highestNumber(sectorId, machineTypeMapping.toDb(type))) ?? 0) + 1;
    if (number > MACHINE_NUMBER_MAX) {
      throw conflict(
        'No machine number left',
        `${type} numbers in sector ${sector.code} already reach ${MACHINE_NUMBER_MAX}. Pick a free lower number.`,
        [{ field: 'number', message: `No number above ${MACHINE_NUMBER_MAX}.` }],
      );
    }
    return { number, tag: buildMachineTag(sector.code, type, number) };
  }

  async create(ownerId: string, body: CreateMachineRequest): Promise<Machine> {
    const sector = await this.machines.findOwnedSector(ownerId, body.sectorId);
    if (!sector) throw notFound('Sector');
    const data: MachineWrite = { ...body, type: machineTypeMapping.toDb(body.type) };
    try {
      return toMachine(await this.machines.create(data));
    } catch (error) {
      throw this.translate(error, buildMachineTag(sector.code, body.type, body.number));
    }
  }

  async update(ownerId: string, id: string, body: UpdateMachineRequest): Promise<Machine> {
    const current = await this.machines.findOwned(ownerId, id);
    if (!current) throw notFound('Machine');
    const sector = body.sectorId
      ? await this.machines.findOwnedSector(ownerId, body.sectorId)
      : current.sector;
    if (!sector) throw notFound('Sector');

    const type = body.type ?? machineTypeMapping.fromDb(current.type);
    const number = body.number ?? current.number;
    const changes: Partial<MachineWrite> = {
      ...(body.sectorId ? { sectorId: body.sectorId } : {}),
      ...(body.type ? { type: machineTypeMapping.toDb(body.type) } : {}),
      ...(body.number ? { number: body.number } : {}),
      ...(body.name ? { name: body.name } : {}),
    };
    try {
      return toMachine(await this.machines.update(id, changes));
    } catch (error) {
      throw this.translate(error, buildMachineTag(sector.code, type, number));
    }
  }

  /** Deletion cascades to what the machine owns, once those exist (B6). */
  async delete(ownerId: string, id: string): Promise<void> {
    if (!(await this.machines.delete(ownerId, id))) throw notFound('Machine');
  }

  /** The unique index on sector, type and number is the authority on tags (B10). */
  private translate(error: unknown, tag: string): unknown {
    if (isUniqueViolation(error)) {
      return conflict('Machine tag in use', `Tag ${tag} is already in use.`, [
        { field: 'number', message: `${tag} already exists. Pick another number.` },
      ]);
    }
    return error;
  }
}
