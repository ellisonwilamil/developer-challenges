import { parseCommand, UsageError } from './cli/parse-args';
import { USAGE } from './cli/usage';

/**
 * Entry point of the simulator. Generating and sending telemetry arrives with the
 * time-series feature; until then the commands refuse to run rather than exit as if
 * they had sent something.
 */
function main(argv: string[]): number {
  try {
    const command = parseCommand(argv);
    if (command.name === 'help') {
      process.stdout.write(USAGE);
      return 0;
    }
    process.stderr.write(
      `${command.name} is not implemented yet: it arrives with the time-series feature.\n`,
    );
    return 1;
  } catch (error) {
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n\n${USAGE}`);
      return 2;
    }
    throw error;
  }
}

process.exitCode = main(process.argv.slice(2));
