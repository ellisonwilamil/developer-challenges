import {
  MAX_READINGS_PER_SUBMISSION,
  type IngestionReport,
  type SensorInstallation,
} from '@condition-monitor/shared';
import type { ApiClient } from '../api/client';
import { SERIES } from '../telemetry/readings';

/** Where the commands write: progress to one stream, problems to the other. */
export interface Output {
  info(line: string): void;
  error(line: string): void;
}

/** Instants per submission, so each one stays within the limit of readings (C8). */
export const INSTANTS_PER_BATCH = Math.floor(MAX_READINGS_PER_SUBMISSION / SERIES.length);

export const count = (value: number) => value.toLocaleString('en-US');

export function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

/**
 * The sensors to simulate, and the serial numbers asked for that are not installed at a
 * point of the user. Those are reported by the caller, never skipped in silence.
 */
export async function discover(
  client: ApiClient,
  serialNumbers: string[],
): Promise<{ sensors: SensorInstallation[]; missing: string[] }> {
  const sensors = await client.listSensors(serialNumbers);
  const found = new Set(sensors.map((sensor) => sensor.serialNumber));
  const missing = serialNumbers
    .map((serial) => serial.trim().toUpperCase())
    .filter((serial) => !found.has(serial));
  return { sensors, missing };
}

export const missingMessage = (missing: string[]) =>
  `Not installed at a monitoring point of this account: ${missing.join(', ')}.`;

export function addReport(total: IngestionReport['totals'], report: IngestionReport): void {
  total.seriesCreated += report.totals.seriesCreated;
  total.readingsInserted += report.totals.readingsInserted;
  total.readingsRepeated += report.totals.readingsRepeated;
}

export const emptyTotals = (): IngestionReport['totals'] => ({
  seriesCreated: 0,
  readingsInserted: 0,
  readingsRepeated: 0,
});
