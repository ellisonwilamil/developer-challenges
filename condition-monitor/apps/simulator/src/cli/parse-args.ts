import { parseArgs } from 'node:util';

/**
 * Commands of the simulator (assumption C13): `backfill` sends a history and exits,
 * `live` sends current readings at a fixed interval, like a real sensor.
 */
export type Command =
  | { name: 'help' }
  | ({ name: 'backfill'; days: number } & CommonOptions)
  | ({ name: 'live' } & CommonOptions);

export interface CommonOptions {
  apiUrl: string;
  intervalMinutes: number;
  seed: number;
  /** Empty means every installed sensor, discovered through the API. */
  serialNumbers: string[];
}

/** A command line that cannot run; the message says what to fix. */
export class UsageError extends Error {
  override readonly name = 'UsageError';
}

export const DEFAULTS = {
  apiUrl: 'http://localhost:3000/api',
  intervalMinutes: 10,
  seed: 1,
  days: 30,
} as const;

/** 50,000 readings per series at the default interval is about 347 days (C8). */
const MAX_BACKFILL_DAYS = 365;

export function parseCommand(argv: string[]): Command {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      help: { type: 'boolean', short: 'h' },
      serial: { type: 'string', multiple: true },
      interval: { type: 'string' },
      seed: { type: 'string' },
      days: { type: 'string' },
      'api-url': { type: 'string' },
    },
  });

  const [name, ...extra] = positionals;
  if (values.help || name === undefined || name === 'help') {
    return { name: 'help' };
  }
  // Unknown options first: the value after an unknown flag is read as a stray argument,
  // and naming that value would hide the real mistake.
  const known = new Set(['help', 'serial', 'interval', 'seed', 'days', 'api-url']);
  const unknown = Object.keys(values).find((key) => !known.has(key));
  if (unknown) {
    throw new UsageError(`Unknown option: --${unknown}`);
  }
  if (extra.length > 0) {
    throw new UsageError(`Unexpected argument: ${extra[0]}`);
  }

  const common: CommonOptions = {
    apiUrl: stringOption(values['api-url'], DEFAULTS.apiUrl),
    intervalMinutes: integerOption('interval', values.interval, DEFAULTS.intervalMinutes, 1, 1440),
    seed: integerOption('seed', values.seed, DEFAULTS.seed, 0, Number.MAX_SAFE_INTEGER),
    serialNumbers: stringList(values.serial),
  };

  if (name === 'backfill') {
    const days = integerOption('days', values.days, DEFAULTS.days, 1, MAX_BACKFILL_DAYS);
    return { name, days, ...common };
  }
  if (name === 'live') {
    if (values.days !== undefined) {
      throw new UsageError('--days applies only to backfill.');
    }
    return { name, ...common };
  }
  throw new UsageError(`Unknown command: ${name}`);
}

function stringOption(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value === '') {
    throw new UsageError('--api-url needs a value.');
  }
  return value;
}

function stringList(value: unknown): string[] {
  if (value === undefined) return [];
  const list = (Array.isArray(value) ? value : [value]).map(String);
  if (list.some((item) => item === '' || item === 'true')) {
    throw new UsageError('--serial needs a serial number.');
  }
  return list;
}

function integerOption(
  flag: string,
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined) return fallback;
  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new UsageError(`--${flag} must be an integer from ${min} to ${max}.`);
  }
  return parsed;
}
