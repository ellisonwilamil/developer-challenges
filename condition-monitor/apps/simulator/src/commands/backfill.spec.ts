import { MAX_READINGS_PER_SUBMISSION } from '@condition-monitor/shared';
import { ApiClient } from '../api/client';
import { DEFAULTS, type BackfillCommand } from '../cli/parse-args';
import { API_URL, captureOutput, fakeApi, fan, pump } from '../testing/fake-api';
import { backfill } from './backfill';

const NOW = Date.UTC(2026, 8, 29, 10, 17);

function command(overrides: Partial<BackfillCommand> = {}): BackfillCommand {
  return {
    name: 'backfill',
    days: 30,
    apiUrl: API_URL,
    intervalMinutes: DEFAULTS.intervalMinutes,
    seed: 1,
    serialNumbers: [],
    ...overrides,
  };
}

function setup(sensors = [fan, pump]) {
  const api = fakeApi(sensors);
  const client = new ApiClient({
    apiUrl: API_URL,
    email: 'op@test',
    password: 'secret',
    fetch: api.fetch,
  });
  return { api, client, ...captureOutput() };
}

describe('backfill', () => {
  it('sends every series of every sensor, in submissions within the limit of readings', async () => {
    const { api, client, out, info } = setup();

    const code = await backfill(command(), { client, now: NOW, out });

    expect(code).toBe(0);
    // 30 days at 10 minutes, 7 series, 2 sensors.
    expect(api.stored.size).toBe(30 * 144 * 7 * 2);
    expect(Math.max(...api.submissions.map((batch) => batch.length))).toBeLessThanOrEqual(
      MAX_READINGS_PER_SUBMISSION,
    );
    expect(info.at(-1)).toBe('Done: 60,480 readings stored, 0 already stored, 14 series created.');
  });

  it('stores nothing new when run again with the same seed (C5, C13)', async () => {
    const { client, out, info } = setup();
    await backfill(command({ days: 2 }), { client, now: NOW, out });

    const code = await backfill(command({ days: 2 }), { client, now: NOW, out });

    expect(code).toBe(0);
    expect(info.at(-1)).toBe('Done: 0 readings stored, 4,032 already stored, 0 series created.');
  });

  it('simulates only the serial numbers given', async () => {
    const { api, client, out } = setup();

    await backfill(command({ days: 1, serialNumbers: ['dx-0002'] }), { client, now: NOW, out });

    expect(new Set([...api.stored.keys()].map((key) => key.split('|')[0]))).toEqual(
      new Set(['DX-0002']),
    );
  });

  it('fails naming a serial number that is not installed, and sends nothing', async () => {
    const { api, client, out, error } = setup();

    const code = await backfill(command({ serialNumbers: ['DX-0001', 'DX-9999'] }), {
      client,
      now: NOW,
      out,
    });

    expect(code).toBe(1);
    expect(error).toEqual(['Not installed at a monitoring point of this account: DX-9999.']);
    expect(api.submissions).toHaveLength(0);
  });

  it('fails when there is no sensor at all: no data is not a success', async () => {
    const { client, out, error } = setup([]);

    expect(await backfill(command(), { client, now: NOW, out })).toBe(1);
    expect(error[0]).toMatch(/No installed sensor found/);
  });

  it('fails with the API message when a submission is refused', async () => {
    const { api, client, out, error } = setup();
    api.state.failures.push(422);

    expect(await backfill(command({ days: 1 }), { client, now: NOW, out })).toBe(1);
    expect(error[0]).toMatch(/Refused for the test/);
  });
});
