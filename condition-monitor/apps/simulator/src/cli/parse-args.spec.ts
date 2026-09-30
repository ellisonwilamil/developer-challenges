import { DEFAULTS, parseCommand, UsageError } from './parse-args';

describe('parseCommand', () => {
  it('shows help without a command, with help or with --help', () => {
    expect(parseCommand([])).toEqual({ name: 'help' });
    expect(parseCommand(['help'])).toEqual({ name: 'help' });
    expect(parseCommand(['live', '--help'])).toEqual({ name: 'help' });
  });

  it('applies the defaults of C13 to a bare backfill', () => {
    expect(parseCommand(['backfill'])).toEqual({
      name: 'backfill',
      days: DEFAULTS.days,
      apiUrl: DEFAULTS.apiUrl,
      intervalMinutes: 10,
      seed: DEFAULTS.seed,
      serialNumbers: [],
    });
  });

  it('reads every option, with repeated serial numbers', () => {
    const command = parseCommand([
      'live',
      '--serial',
      'DX-1',
      '--serial',
      'DX-2',
      '--interval',
      '5',
      '--seed',
      '42',
      '--api-url',
      'http://api:3000/api',
    ]);

    expect(command).toEqual({
      name: 'live',
      apiUrl: 'http://api:3000/api',
      intervalMinutes: 5,
      seed: 42,
      serialNumbers: ['DX-1', 'DX-2'],
    });
  });

  it('limits --days to the 50,000 readings a series holds, at the chosen interval (C8)', () => {
    expect(parseCommand(['backfill', '--days', '1'])).toMatchObject({ days: 1 });
    expect(parseCommand(['backfill', '--days', '347'])).toMatchObject({ days: 347 });
    expect(parseCommand(['backfill', '--days', '365', '--interval', '15'])).toMatchObject({
      days: 365,
    });
    expect(() => parseCommand(['backfill', '--days', '0'])).toThrow(
      '--days must be an integer from 1 to 347.',
    );
    expect(() => parseCommand(['backfill', '--days', '348'])).toThrow(
      '--days 348 at a 10-minute interval gives 50,112 readings per series, above the limit of 50,000: at most 347 days.',
    );
  });

  it('rejects an interval that is not a positive integer', () => {
    expect(parseCommand(['live', '--interval', '1'])).toMatchObject({ intervalMinutes: 1 });
    expect(() => parseCommand(['live', '--interval', '0'])).toThrow(UsageError);
    expect(() => parseCommand(['live', '--interval', '2.5'])).toThrow(UsageError);
    expect(() => parseCommand(['live', '--interval', 'ten'])).toThrow(UsageError);
  });

  it('rejects what it does not know, naming it', () => {
    expect(() => parseCommand(['replay'])).toThrow('Unknown command: replay');
    expect(() => parseCommand(['live', '--speed', '2'])).toThrow('Unknown option: --speed');
    expect(() => parseCommand(['live', 'extra'])).toThrow('Unexpected argument: extra');
    expect(() => parseCommand(['live', '--days', '3'])).toThrow('--days applies only to backfill.');
  });

  it('rejects a flag given without its value', () => {
    expect(() => parseCommand(['live', '--serial'])).toThrow('--serial needs a serial number.');
  });
});
