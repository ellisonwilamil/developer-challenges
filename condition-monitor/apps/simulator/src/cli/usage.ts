import { DEFAULTS } from './parse-args';

export const USAGE = `Condition Monitor sensor simulator

Usage:
  simulator backfill [options]   send a history of telemetry and exit
  simulator live [options]       send current telemetry at a fixed interval
  simulator help                 show this help

Options:
  --serial <number>     simulate only this sensor; repeat for several.
                        Default: every installed sensor, discovered through the API.
  --interval <minutes>  time between readings. Default: ${DEFAULTS.intervalMinutes}.
  --seed <integer>      seed of the noise; the same seed gives the same values.
                        Default: ${DEFAULTS.seed}.
  --days <days>         backfill only: days of history, up to 365. Default: ${DEFAULTS.days}.
  --api-url <url>       Default: ${DEFAULTS.apiUrl}.
  -h, --help            show this help
`;
