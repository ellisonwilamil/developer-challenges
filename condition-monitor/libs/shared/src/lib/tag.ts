import type { MachineType } from './machine.js';

/**
 * Builds the plant tag of a machine from its parts, such as `DRY-FAN-01` (assumption
 * B10). The tag is never stored: it is built here, in one place, whenever it is shown,
 * so it cannot go stale when a sector code changes.
 */
export function buildMachineTag(sectorCode: string, type: MachineType, number: number): string {
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(`Machine number must be an integer greater than or equal to 1: ${number}`);
  }
  return `${sectorCode}-${type.toUpperCase()}-${String(number).padStart(2, '0')}`;
}
